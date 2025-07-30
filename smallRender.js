import { PawaElement } from "pawajs/pawaElement.js"
import {getCurrentContext, useInsert, useValidateProps} from 'pawajs'
export const fetchDomRender=(el,tree)=>{
    if (el === null) {
        return
    }
    PawaElement.Element(el)
  
  let appTree = {
  element: el.tagName,
  serverKey:el.getAttribute('server-key'),
  pawaAttributes: el._pawaAttribute|| {},
  isComponent: el._componentOrTemplate || el._isElementComponent || false,
  elementComponent:el._isElementComponent,
  componentName:el._componentName,
  textContentAvoid:false,
  new:false,
  children:[],
  thisSame:false,
  inserted:false,
  isMatched:false,
  beforeElement:null,
}
if(Array.from(el.childNodes).some(node => 
      node.nodeType === Node.TEXT_NODE && node.nodeValue.includes('@{')
   )) {
     appTree.textContentAvoid=true
   } 
el._tree=appTree

//console.log(el)
    return el
}

export const componentSettings=(el,app1)=>{
    const children=app1._componentChildren
    const stateContext=getCurrentContext()
        /**
         * @type {DocumentFragment}
         */
        // console.log(app1._props);
        
        const slot=app1._slots
        const slots={}
        stateContext._hasRun=true
        Array.from(slot.children).forEach(prop =>{
          if (prop.getAttribute('prop')) {
            slots[prop.getAttribute('prop')]=prop.innerHTML
          }else{
            console.warn('sloting props must have prop attribute')
          }
        })    
        const insert=useInsert
        // const useValidateProps=useValidateProps
    
        const app = {
          children,
          app:{insert,useValidateProps},
          ...slots,
          ...app1._props
        }
        return app
}
