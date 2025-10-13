import { ValDerivationNode } from "./types";

export const API_JAR_GLOB = "lib/liquidjava-api*.jar";
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
export const EXAMPLE_DERIVATION_NODE: ValDerivationNode = {
  val: "#x_10 == -2 + x",
  origin: {
    op: "==",
    left: {
      val: "#x_10"
    },
    right: {
      val: "-2 + x",
      origin: {
        op: "+",
        left: {
          val: -2,
          origin: {
            op: "+",
            left: {
              val: 3,
              origin: {
                op: "/",
                left: {
                  val: 6,
                  origin: {
                    var: "#a_8"
                  }
                },
                right: {
                  val: 2,
                  origin: {
                    var: "#b_7"
                  }
                }
              }
            },
            right: {
              val: -5,
              origin: {
                op: "-",
                operand: {
                  val: 5
                }
              }
            }
          }
        },
        right: {
          val: "x",
          origin: {
            var: "#x_9"
          }
        }
      }
    }
  }
}
