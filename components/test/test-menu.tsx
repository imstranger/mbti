import { Flex, Button } from "@chakra-ui/react";
import { RiInformationLine } from "react-icons/ri";

import TestTimer from "./test-timer";

interface TestMenuProps {
  onShowInstructionsButtonClick: () => void;
}

export default function TestMenu(props: TestMenuProps) {
  return (
    <Flex
      width="full"
      my={2}
      px={4}
      direction="column"
      justifyContent="center"
      alignItems="flex-end"
      gap={2}
    >
      <Flex>
        <TestTimer />
        <Button
          aria-label="instructions"
          variant="solid"
          leftIcon={<RiInformationLine size={24} />}
          onClick={props.onShowInstructionsButtonClick}
        >
          说明
        </Button>
      </Flex>
    </Flex>
  );
}
