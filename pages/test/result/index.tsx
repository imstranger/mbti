import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Option, AsyncData, Result } from "@swan-io/boxed";
import { Button, Flex, Show, Text } from "@chakra-ui/react";

import MainLayout from "../../../components/layouts/main-layout";
import TestReportDocument from "../../../components/test/test-report-document";
import TestResult from "../../../components/test/test-result";
import TestResultStats from "../../../components/test/test-result-stats";
import TestResultTableOfContent from "../../../components/test/test-result-table-of-content";
import {
  TestResult as ITestResult,
  getPersonalityClassGroupByTestScores,
  getSavedTestResult,
} from "../../../lib/personality-test";
import { downloadReportPdf } from "../../../lib/report-pdf";

export default function TestResultPage() {
  const router = useRouter();

  const [testResult, setTestResult] = useState<
    AsyncData<Result<Option<ITestResult>, Error>>
  >(AsyncData.NotAsked());

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady) {
      setTestResult(AsyncData.Loading());

      const id = parseInt(router.query.testResultId as string);

      getSavedTestResult(id).tap((result) =>
        setTestResult(AsyncData.Done(result))
      );
    }
  }, [router.isReady, router.query.testResultId]);

  const data: ITestResult | null = testResult.match({
    NotAsked: () => null,
    Loading: () => null,
    Done: (result) =>
      result.match({
        Error: () => null,
        Ok: (option) =>
          option.match({ Some: (value) => value, None: () => null }),
      }),
  });

  const handleDownloadPdf = async () => {
    if (data === null || isGeneratingPdf) {
      return;
    }

    const personalityClassGroup = getPersonalityClassGroupByTestScores(
      data.testScores
    );
    const fileName = `MBTI-${personalityClassGroup.type}-${dayjs(
      data.timestamp
    ).format("YYYY-MM-DD")}`;

    setIsGeneratingPdf(true);
    setPdfError(null);

    try {
      await downloadReportPdf(fileName);
    } catch {
      // 自动生成失败时退回浏览器打印，并把原因明确告诉用户
      setPdfError("自动生成失败，已切换为打印方式：在打印窗口选择「另存为 PDF」");
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <>
      <div id="app-shell">
        <MainLayout hideBackground={true}>
          {data === null ? (
            testResult.match({
              NotAsked: () => <Text>加载中</Text>,
              Loading: () => <Text>加载中</Text>,
              Done: (result) =>
                result.match({
                  Error: () => <Text>出现错误！请刷新页面！</Text>,
                  Ok: (option) =>
                    option.match({
                      Some: () => <Text>加载中</Text>,
                      None: () => <Text>没有数据</Text>,
                    }),
                }),
            })
          ) : (
            <Flex
              h="full"
              direction={{
                base: "column",
                lg: "row",
              }}
            >
              <TestResultStats testResult={data} />
              <TestResult testResult={data} />
              <Show above="lg">
                <TestResultTableOfContent />
              </Show>
            </Flex>
          )}
          {data !== null && (
            <Flex
              position="fixed"
              right={6}
              bottom={6}
              zIndex={20}
              gap={1}
              direction="column"
              alignItems="flex-end"
            >
              <Button
                colorScheme="primary"
                onClick={handleDownloadPdf}
                isLoading={isGeneratingPdf}
                loadingText="正在生成 PDF"
                isDisabled={isGeneratingPdf}
              >
                下载 PDF 报告
              </Button>
              <Text
                px={2}
                py={1}
                bg="white"
                rounded="md"
                fontSize="xs"
                color={pdfError ? "red.500" : "gray.600"}
                boxShadow="sm"
              >
                {isGeneratingPdf
                  ? "正在排版，稍等几秒…"
                  : pdfError ?? "点击后自动下载 PDF"}
              </Text>
            </Flex>
          )}
        </MainLayout>
      </div>
      {data !== null && <TestReportDocument testResult={data} />}
    </>
  );
}