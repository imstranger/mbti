import type { ReactNode } from "react";
import {
  Box,
  Heading,
  ListItem,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Tr,
  UnorderedList,
} from "@chakra-ui/react";
import dayjs from "dayjs";

import { personalityClasses } from "../../data/personality-classes";
import {
  PersonalityClass,
  TestResult,
  getPersonalityClassGroupByTestScores,
} from "../../lib/personality-test";

interface TestReportDocumentProps {
  testResult: TestResult;
}

function getDimensionStats(
  testScores: PersonalityClass["type"][],
  target: PersonalityClass["type"]
) {
  const total = testScores.length;
  const matched = testScores.filter((score) => score === target).length;
  const percent = total === 0 ? 0 : (matched / total) * 100;

  return {
    matched,
    total,
    percentText: percent.toFixed(2).replace(/[.,]0+$/, ""),
  };
}

function SectionTitle(props: { children: ReactNode }) {
  return (
    <Heading
      as="h2"
      mt={6}
      mb={3}
      pb={1}
      fontSize="md"
      borderBottom="1px solid"
      borderColor="gray.300"
    >
      {props.children}
    </Heading>
  );
}

function Paragraph(props: { text: string }) {
  return (
    <Text
      fontSize="sm"
      lineHeight="tall"
      textAlign="justify"
      whiteSpace="pre-wrap"
    >
      {props.text}
    </Text>
  );
}

function BulletList(props: { items: string[] }) {
  return (
    <UnorderedList
      pl={5}
      spacing={1}
      fontSize="sm"
    >
      {props.items.map((item, index) => (
        <ListItem
          key={index}
          textAlign="justify"
        >
          {item}
        </ListItem>
      ))}
    </UnorderedList>
  );
}

export default function TestReportDocument(props: TestReportDocumentProps) {
  const personalityClassGroup = getPersonalityClassGroupByTestScores(
    props.testResult.testScores
  );
  const testDate = dayjs(props.testResult.timestamp).format("YYYY-MM-DD HH:mm");

  return (
    <Box
      id="print-report"
      bg="white"
      color="black"
      fontSize="sm"
    >
      <Box
        textAlign="center"
        borderBottom="2px solid"
        borderColor="gray.800"
        pb={4}
        mb={2}
      >
        <Text
          fontSize="xs"
          letterSpacing="0.4em"
          color="gray.600"
        >
          MBTI 性格测试报告
        </Text>
        <Heading
          as="h1"
          my={2}
          fontSize="5xl"
          color="primary.600"
        >
          {personalityClassGroup.type}
        </Heading>
        <Text
          fontSize="xl"
          fontWeight="bold"
        >
          {personalityClassGroup.epithet}
        </Text>
        <Text
          mt={1}
          fontSize="sm"
          color="gray.700"
        >
          {personalityClassGroup.nameDescription}
        </Text>
        <Text
          mt={3}
          fontSize="xs"
          color="gray.500"
        >
          {`测试时间：${testDate}`}
        </Text>
      </Box>

      <SectionTitle>四维偏好得分</SectionTitle>
      <Table
        size="sm"
        variant="simple"
      >
        <Tbody>
          {personalityClasses.map((personalityClass) => {
            const dimensionStat = getDimensionStats(
              props.testResult.testScores,
              personalityClass.type
            );

            return (
              <Tr key={personalityClass.type}>
                <Th
                  w="60%"
                  textAlign="left"
                  fontSize="sm"
                  fontWeight="normal"
                  textTransform="none"
                >
                  {personalityClass.description}
                </Th>
                <Td fontSize="sm">
                  {`${dimensionStat.percentText}%（${dimensionStat.matched}/${dimensionStat.total}）`}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>

      <SectionTitle>类型描述</SectionTitle>
      <Paragraph text={personalityClassGroup.description} />

      <SectionTitle>荣格功能偏好排序</SectionTitle>
      <Table
        size="sm"
        variant="simple"
      >
        <Tbody>
          <Tr>
            <Th
              w="30%"
              textAlign="left"
              fontSize="sm"
              textTransform="none"
            >
              主导功能
            </Th>
            <Td fontSize="sm">
              {personalityClassGroup.jungianFunctionalPreference.dominant}
            </Td>
          </Tr>
          <Tr>
            <Th
              w="30%"
              textAlign="left"
              fontSize="sm"
              textTransform="none"
            >
              辅助功能
            </Th>
            <Td fontSize="sm">
              {personalityClassGroup.jungianFunctionalPreference.auxiliary}
            </Td>
          </Tr>
          <Tr>
            <Th
              w="30%"
              textAlign="left"
              fontSize="sm"
              textTransform="none"
            >
              第三功能
            </Th>
            <Td fontSize="sm">
              {personalityClassGroup.jungianFunctionalPreference.tertiary}
            </Td>
          </Tr>
          <Tr>
            <Th
              w="30%"
              textAlign="left"
              fontSize="sm"
              textTransform="none"
            >
              劣势功能
            </Th>
            <Td fontSize="sm">
              {personalityClassGroup.jungianFunctionalPreference.inferior}
            </Td>
          </Tr>
        </Tbody>
      </Table>

      <SectionTitle>{`${personalityClassGroup.type} 总体特质`}</SectionTitle>
      <BulletList items={personalityClassGroup.generalTraits} />

      <SectionTitle>人际关系优点</SectionTitle>
      <BulletList items={personalityClassGroup.relationshipStrengths} />

      <SectionTitle>人际关系不足</SectionTitle>
      <BulletList items={personalityClassGroup.relationshipWeaknesses} />

      <SectionTitle>成功定义</SectionTitle>
      <Paragraph text={personalityClassGroup.successDefinition} />

      <SectionTitle>优势</SectionTitle>
      <BulletList items={personalityClassGroup.strengths} />

      <SectionTitle>特殊天赋</SectionTitle>
      <BulletList items={personalityClassGroup.gifts} />

      <SectionTitle>潜在问题领域</SectionTitle>
      {personalityClassGroup.potentialProblemAreas.length === 1 ? (
        <Paragraph text={personalityClassGroup.potentialProblemAreas[0]} />
      ) : (
        <BulletList items={personalityClassGroup.potentialProblemAreas} />
      )}

      <SectionTitle>问题解释</SectionTitle>
      <Paragraph text={personalityClassGroup.explanationOfProblems} />

      <SectionTitle>解决方案</SectionTitle>
      <Paragraph text={personalityClassGroup.solutions} />

      <SectionTitle>快乐生活小提示</SectionTitle>
      <Paragraph text={personalityClassGroup.livingHappilyTips} />

      {personalityClassGroup.suggestions !== undefined &&
        personalityClassGroup.suggestions.length > 0 && (
          <>
            <SectionTitle>具体建议</SectionTitle>
            {personalityClassGroup.suggestions.length === 1 ? (
              <Paragraph text={personalityClassGroup.suggestions[0]} />
            ) : (
              <BulletList items={personalityClassGroup.suggestions} />
            )}
          </>
        )}

      <SectionTitle>实现成功的生活十则</SectionTitle>
      <BulletList items={personalityClassGroup.tenRulesToLive} />

      <Box
        mt={8}
        pt={3}
        borderTop="1px solid"
        borderColor="gray.300"
      >
        <Text
          fontSize="xs"
          color="gray.500"
        >
          本报告基于 MBTI 自评问卷结果生成，仅供自我探索与参考，不构成心理诊断或任何专业评估。
        </Text>
      </Box>
    </Box>
  );
}