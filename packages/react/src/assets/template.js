/**
 * This function is used as a template to generate SVG components with svgr.
 * @internal
 */
function template(variables, { tpl }) {
  return tpl`
  ${'/**\n * WARNING: This file was auto-generated by svgr. Do not edit.\n @internal \n */\n'}
  ${variables.imports};
  
  ${variables.interfaces};
  
  const ${variables.componentName} = (${variables.props}) => (
    ${variables.jsx}
  );
  
  ${variables.exports};
  `;
}

module.exports = template;
