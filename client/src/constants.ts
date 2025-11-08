import { ValDerivationNode } from "./types";

export const SERVER_JAR_FILENAME = "language-server-liquidjava.jar";
export const DEBUG_MODE = false;
export const DEBUG_PORT = 50000;
export const LIQUIDJAVA_SCOPES = [
    "source.liquidjava keyword.other.liquidjava",
    "source.liquidjava entity.name.function.liquidjava",
    "source.liquidjava storage.type.primitive.liquidjava",
    "source.liquidjava entity.name.type.liquidjava",
    "source.liquidjava entity.name.type.class.liquidjava",
    "source.liquidjava entity.name.type.externalref.liquidjava",
    "source.liquidjava variable.other.liquidjava",
    "source.liquidjava keyword.operator.liquidjava",
    "source.liquidjava constant.language.boolean.liquidjava",
    "source.liquidjava constant.numeric.liquidjava",
    "keyword.operator.liquidjava",
    "constant.language.boolean.liquidjava",
    "constant.numeric.liquidjava",
];
export const EXAMPLE_EXPECTED = "#x_10 < 0"
export const EXAMPLE_DERIVATION_NODE: ValDerivationNode ={
  val: "#result_12 == 3",
  origin: {
    op: "==",
    left: {
      val: "#result_12",
    },
    right: {
      val: 3,
      origin: {
        op: "/",
        left: {
          val: 6,
          origin: {
            var: "#a_10",
          }
        },
        right: {
          val: 2,
          origin: {
            var: "#b_11",
          }
        }
      }
    }
  }
};
export const EXAMPLE_TRANSLATION_TABLE = {
  "#result_12": {
    created: "int result = a / b",
    file: "/Users/rcosta/GitHub/liquidjava-examples/examples/demo/src/main/java/com/example/project/Example.java",
    line: 11,
    column: 12
  },
  "#a_8": {
    created: "int a = 6",
    file: "/Users/rcosta/GitHub/liquidjava-examples/examples/demo/src/main/java/com/example/project/Example.java",
    line: 9,
    column: 12
  },
  "#b_9": {
    created: "int b = 2",
    file: "/Users/rcosta/GitHub/liquidjava-examples/examples/demo/src/main/java/com/example/project/Example.java",
    line: 10,
    column: 12
  },
  "#a_10": {
    created: "a",
    file: "/Users/rcosta/GitHub/liquidjava-examples/examples/demo/src/main/java/com/example/project/Example.java",
    line: 11,
    column: 21
  },
  "#b_11": {
    created: "b",
    file: "/Users/rcosta/GitHub/liquidjava-examples/examples/demo/src/main/java/com/example/project/Example.java",
    line: 11,
    column: 25
  }
}
