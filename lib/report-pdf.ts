/**
 * 一键导出 A4 PDF 报告。
 *
 * 项目是 next export 的纯静态站点，没有 Node 服务端，所以 PDF 只能在浏览器里生成：
 *   1. 把 #print-report 这块正文临时摆到屏幕外，用 html2canvas 渲染成一张高清位图；
 *   2. 按 A4 可打印区域的高度切页，切分点优先落在空白带上，避免把一行字从中间截断；
 *   3. 逐页贴进 jsPDF，加页码，最后触发浏览器下载。
 *
 * 依赖（需随项目安装）：html2canvas、jspdf。
 */

const A4 = { width: 210, height: 297, margin: 14 };
/** A4 去掉页边距后的正文区域：182mm × 269mm */
const CONTENT_WIDTH_MM = A4.width - A4.margin * 2;
const CONTENT_HEIGHT_MM = A4.height - A4.margin * 2;

/** 正文渲染宽度：182mm 在 96dpi 下约 688px，与打印版式保持一致 */
const RENDER_WIDTH_PX = 688;
/** 位图放大倍数，2 倍约等于 192dpi，文字清晰且体积可控 */
const RENDER_SCALE = 2;
/** 浏览器单张画布的高度上限（Chrome 系约 16384px），超长报告要据此降级缩放 */
const MAX_CANVAS_HEIGHT_PX = 16000;
/** 找空白带时向上回溯的最大像素数 */
const BLANK_SEARCH_PX = 260;
/** 判定整行空白的灰度阈值 */
const BLANK_THRESHOLD = 246;

interface ElementStyleSnapshot {
  display: string;
  position: string;
  left: string;
  top: string;
  width: string;
  zIndex: string;
}

function snapshotStyle(element: HTMLElement): ElementStyleSnapshot {
  return {
    display: element.style.display,
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
    width: element.style.width,
    zIndex: element.style.zIndex,
  };
}

function restoreStyle(element: HTMLElement, snapshot: ElementStyleSnapshot) {
  element.style.display = snapshot.display;
  element.style.position = snapshot.position;
  element.style.left = snapshot.left;
  element.style.top = snapshot.top;
  element.style.width = snapshot.width;
  element.style.zIndex = snapshot.zIndex;
}

/** 某一行像素是否全是接近纯白（没有文字、边框、表格线） */
function isBlankRow(
  ctx: CanvasRenderingContext2D,
  y: number,
  width: number
): boolean {
  const row = ctx.getImageData(0, y, width, 1).data;

  for (let i = 0; i < row.length; i += 4 * 2) {
    if (
      row[i] < BLANK_THRESHOLD ||
      row[i + 1] < BLANK_THRESHOLD ||
      row[i + 2] < BLANK_THRESHOLD
    ) {
      return false;
    }
  }

  return true;
}

/**
 * 在理想分页线上方找一条空白带作为实际切点。
 * 找不到就退回理想分页线，宁可切在行间也不越过 minRow。
 */
function findSafeBreakRow(
  ctx: CanvasRenderingContext2D,
  idealRow: number,
  minRow: number,
  width: number
): number {
  const limit = Math.max(minRow, idealRow - BLANK_SEARCH_PX);

  for (let y = idealRow; y >= limit; y -= 1) {
    if (isBlankRow(ctx, y, width)) {
      return y;
    }
  }

  return idealRow;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/**
 * 生成并下载 PDF。
 * @param fileBaseName 文件名主体（不含 .pdf），例如 MBTI-INTJ-2026-11-09
 */
export async function downloadReportPdf(fileBaseName: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("只能在浏览器里生成 PDF");
  }

  const element = document.getElementById("print-report");

  if (element === null) {
    throw new Error("报告内容还没有渲染完成");
  }

  const snapshot = snapshotStyle(element);

  // 屏幕态下 #print-report 是 display:none，先临时挪到屏幕外并给足宽度再渲染
  element.style.display = "block";
  element.style.position = "fixed";
  element.style.left = "-10000px";
  element.style.top = "0";
  element.style.width = `${RENDER_WIDTH_PX}px`;
  element.style.zIndex = "-1";

  try {
    await nextFrame();

    // 动态引入：这两个包会用到 window/document，静态引入会让 next export 预渲染阶段报错
    // 等字体就绪，避免中文回退字体导致排版抖动
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // 报告过长时按浏览器画布高度上限降级缩放，否则整张图会渲染失败
    const scale = Math.min(
      RENDER_SCALE,
      Math.max(1, MAX_CANVAS_HEIGHT_PX / Math.max(1, element.scrollHeight))
    );

    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    const canvas = await html2canvas(element, {
      scale,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (ctx === null) {
      throw new Error("无法获取画布上下文");
    }

    const pxPerMm = canvas.width / CONTENT_WIDTH_MM;
    const pageHeightPx = Math.floor(CONTENT_HEIGHT_MM * pxPerMm);

    // 先算好每一页的起止像素，得到确切页数后再渲染
    const pages: Array<{ start: number; end: number }> = [];
    let start = 0;

    while (start < canvas.height) {
      const idealEnd = Math.min(start + pageHeightPx, canvas.height);
      let end = idealEnd;

      if (idealEnd < canvas.height) {
        end = findSafeBreakRow(
          ctx,
          idealEnd,
          start + Math.floor(pageHeightPx * 0.55),
          canvas.width
        );
      }

      if (end <= start) {
        end = idealEnd;
      }

      pages.push({ start, end });
      start = end;
    }

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    });

    pages.forEach((page, index) => {
      const sliceHeight = page.end - page.start;
      const slice = document.createElement("canvas");

      slice.width = canvas.width;
      slice.height = sliceHeight;

      const sliceCtx = slice.getContext("2d");

      if (sliceCtx === null) {
        return;
      }

      sliceCtx.fillStyle = "#ffffff";
      sliceCtx.fillRect(0, 0, slice.width, slice.height);
      sliceCtx.drawImage(
        canvas,
        0,
        page.start,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight
      );

      if (index > 0) {
        pdf.addPage();
      }

      pdf.addImage(
        slice.toDataURL("image/jpeg", 0.92),
        "JPEG",
        A4.margin,
        A4.margin,
        CONTENT_WIDTH_MM,
        sliceHeight / pxPerMm
      );

      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `${index + 1} / ${pages.length}`,
        A4.width / 2,
        A4.height - A4.margin / 2,
        { align: "center" }
      );
    });

    pdf.save(`${fileBaseName}.pdf`);
  } finally {
    restoreStyle(element, snapshot);
  }
}