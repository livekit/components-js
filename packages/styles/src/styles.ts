import * as CSS from 'csstype';

type ValueOrArray<T> = T | ValueOrArray<T>[];
type NestedStringArray = ValueOrArray<string>;

type RuleOrProps<T> = Record<string, T | RuleOrProps<T>[]>;
export type StyleRule = RuleOrProps<CSS.Properties>;

export const buttonStyles: StyleRule = {
  button: {
    borderRadius: '10%',
    backgroundColor: 'blue',
  },
};

function style(...rules: StyleRule[]) {
  for (const rule of rules) {
  }
}
