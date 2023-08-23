import { DocSection, TSDocConfiguration } from '@microsoft/tsdoc';
import { ParameterItem } from './ParameterItem';
import { ParameterList, sortParameters } from './ParameterList';

const configuration = new TSDocConfiguration();
const dummyDocs = new DocSection({ configuration }).nodes;

function dummyParameterItem(name: string, optional: boolean): ParameterItem {
  return new ParameterItem({
    configuration,
    attributes: {
      name: name,
      type: 'not-used',
      optional: optional,
      description: dummyDocs,
    },
  });
}

test('Test already sorted parameter list stays sorted.', () => {
  const parameters = [
    dummyParameterItem('a', false),
    dummyParameterItem('b', false),
    dummyParameterItem('c', false),
  ];
  const sortedParameters = sortParameters([...parameters]);
  expect(sortedParameters).toStrictEqual(parameters);
});

test('Test non optional parameter come before optional.', () => {
  const parameters = [dummyParameterItem('a', true), dummyParameterItem('b', false)];
  const sortedParameters = sortParameters([...parameters]);
  expect(sortedParameters[0].attributes.name).toBe('b');
  expect(sortedParameters[1].attributes.name).toBe('a');
});

test('Test non optional parameter come before optional but still sort by name.', () => {
  const parameters = [
    dummyParameterItem('a', true),
    dummyParameterItem('b', false),
    dummyParameterItem('c', true),
  ];
  const sortedParameters = sortParameters([...parameters]);
  expect(sortedParameters[0].attributes.name).toBe('b');
  expect(sortedParameters[1].attributes.name).toBe('a');
  expect(sortedParameters[2].attributes.name).toBe('c');
});

test('Test ParameterList parameters are sorted after adding them with `addParameter()`.', () => {
  const parameterList = new ParameterList({ configuration });
  parameterList.addParameter(dummyParameterItem('c', true));
  parameterList.addParameter(dummyParameterItem('b', false));
  parameterList.addParameter(dummyParameterItem('a', true));
  const sortedParameters = parameterList.getParameters();
  expect(sortedParameters.map((p) => p.attributes.name)).toStrictEqual(['b', 'a', 'c']);
});
