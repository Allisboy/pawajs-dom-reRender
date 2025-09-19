import { PawaElement } from "../example/pawajs/pawaElement.js"
import {getCurrentContext, useInsert} from '../example/pawajs/index.js'
export const fetchDomRender=(el,tree)=>{
    if (el === null) {
        return
    }
    const context=el._contexts || {}
    PawaElement.Element(el,context)
  
  let appTree = {
  element: el.tagName,
  serverKey:el.getAttribute('s-key'),
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

        // PawaElement.Element(app1,{...el._context})
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
          app:{insert},
          ...slots,
          ...app1._props
        }
        return {app,slots,prop:app1._props}
}
