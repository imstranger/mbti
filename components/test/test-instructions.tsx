import {
  Flex,
  Heading,
  Text,
  UnorderedList,
  ListItem,
  Button,
} from "@chakra-ui/react";

interface TestInstructionsProps {
  onCloseTestInstructions: () => void;
}

export default function TestInstructions(props: TestInstructionsProps) {
  return (
    <Flex
      h="full"
      px={4}
      direction="column"
      gap={8}
    >
      <Heading>说明</Heading>
      <Flex
        direction="column"
        gap={2}
      >
        <Text>
          完成测试大约只需要15分钟。以下是一些完成这个测试的提示：
        </Text>
        <UnorderedList spacing={2}>
          <ListItem>
            这些问题没有正确答案。
          </ListItem>
          <ListItem>
            快速回答问题，不要过度分析。有些可能措辞不当，选择你感觉最合适的答案。
          </ListItem>
          <ListItem>
            根据“你实际的情况”回答问题，而不是“你希望别人如何看待你”。
          </ListItem>
        </UnorderedList>
      </Flex>
      <Button
        w="min-content"
        colorScheme="primary"
        alignSelf="flex-end"
        onClick={props.onCloseTestInstructions}
      >
        好的，我明白了！
      </Button>
    </Flex>
  );
}
