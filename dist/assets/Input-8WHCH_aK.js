import{j as e}from"./vendor-query-dOYxXkJ3.js";import{a as i}from"./vendor-react-CfkJOBur.js";const n=i.forwardRef(({className:o="",label:r,error:t,id:d,...s},c)=>{const a=d||(r==null?void 0:r.toLowerCase().replace(/\s/g,"-"));return e.jsxs("div",{className:"w-full",children:[r&&e.jsx("label",{htmlFor:a,className:"block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300",children:r}),e.jsx("input",{ref:c,id:a,className:`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 transition-colors
            ${t?"border-red-500":"border-gray-300 dark:border-gray-600"}
            ${s.disabled?"bg-gray-100 dark:bg-gray-800 cursor-not-allowed":"bg-white dark:bg-gray-700"}
            dark:text-white placeholder-gray-400
            focus:ring-blue-500 focus:border-blue-500
            ${o}`,...s}),t&&e.jsx("p",{className:"mt-1 text-sm text-red-500",children:t})]})});n.displayName="Input";export{n as I};
