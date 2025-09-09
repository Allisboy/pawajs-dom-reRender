import {PawaElement} from 'pawajs/pawaElement.js';
import Pawa, {setStateContext,render, keepContext}from 'pawajs/index.js';
import {sanitizeTemplate} from 'pawajs/utils.js';
import { pawaCompare} from './compare.js';
import { componentSettings, fetchDomRender } from './smallRender.js';
// next is to reArrange the element accordingly to the updated style
const scheduled = new Set();
let rafScheduled = false;

function scheduleRender(fn) {
  scheduled.add(fn);
  if (!rafScheduled) {
    rafScheduled = true;
    requestAnimationFrame(() => {
      scheduled.forEach(f => f());
      scheduled.clear();
      rafScheduled = false;
    });
  }
}
const  pluginMap=new Map()
/**
 * @param  {{
 *  afterMatch:{
 *  name:string,
 *  plugin:(app:PawaElement | HTMLElement,app1:PawaElement | HTMLElement)=>void
 * }
 * }} objects
 */
export const registerPlugin=(objects)=>{
  if (objects.afterMatch && typeof objects.afterMatch.plugin === 'function' && objects.afterMatch.name) {
    pluginMap.set(objects.afterMatch.name,objects.afterMatch.plugin)
  }
}


export const pawaRender=(app,app1) => {
  app1._contexts=app._context //transfer context
  //compare current element tree with the fetched element tree
    if (!pawaCompare(app,fetchDomRender(app1))) {
      // scheduleRender(()=>{
      //   const parent=app.parentElement
      //   app._remove(()=>{
      //     parent.appendChild(app1)
      //     render(app1,parent._context,parent._tree)
      //   })
      // })      
      console.warn(`miss Matched at`,app._tree,app1._tree,app1)
      return
    }
     pluginMap.forEach((plugin, name)=>{
      plugin(app, app1)
    })
    if (app._tree.textContextAvoid !== true && app1.textContextAvoid !== true) {
      if (!app.firstElementChild && !app1.firstElementChild) {
        const text=app1.textContent
        app.textContent=text
      }
    }
    const promisedArray=[]
    
    //// Attributes 
    Array.from(app1.attributes).forEach((attr) => {
      if (attr.name.startsWith('-') || attr.name.startsWith(':')) {
        return
      }
      if (!app._pawaAttribute[attr.name]) {
            if(app._preRenderAvoid.includes(attr.name))return //attribute to avoid because client is controlling updates like animation etc
             app.setAttribute(attr.name,attr.value)   
          }
      })
            
       
     if (app._tree.thisSame) {
      //this category is for element that has pawajs condition directives 
      //they are this same means the directives original children are the clone nodes of the same element
        app1.removeAttribute(app._tree.primaryAttribute)
      // console.log(app,app1)
      
        app._tree.children.forEach((appTree) => {
         scheduleRender(() => {
           if(app._tree.primaryAttribute === 'for'){
               app1.setAttribute('for-unique',appTree.pawaAttributes['for-unique'])
               if(appTree.pawaAttributes['for-key']){
                 app1.setAttribute('for-key',appTree.pawaAttributes['for-key'])
                }
              }
               pawaRender(appTree.el,app1)
           })
       })
       app.innerHTML=app1.innerHTML
       return
     } else {
       if (app._componentName && !app._isElementComponent && app._tree.isComponent) {
         const stateContext=app._tree.stateContext
         setStateContext(stateContext)
        const app2= componentSettings(app,app1)
         const div=document.createElement('div')
         
         const compo=stateContext.component(app2)
       // console.log(app._tree.children[1])
         div.innerHTML=sanitizeTemplate(compo)
              if(Object.entries(app1._restProps).length > 0){
      const findElement=div.querySelector('[--]') || div.querySelector('[rest]')
      if (findElement) {
        for (const [key,value] of Object.entries(app1._restProps)) {
            findElement.setAttribute(value.name,value.value)
            findElement.removeAttribute('--')
            findElement.removeAttribute('rest')
      }
    }
  }
         Array.from(div.children).forEach((child,index) => {
          // console.log(child)
             scheduleRender(() => {
                pawaRender(app._tree.children[index].el,child)
             })
         })
         
       } else {
         const newAppTree=[]
         const removeElement=[]
         const parent=app._tree.children[0]?.parent.el || app 
         const parentTree=app._tree
              if (app._tree.element !== 'TEMPLATE') {
                Array.from(app1.children).forEach((child,index) => {
                  
                  newAppTree.push(fetchDomRender(child))
                })
              }
              if (app._tree.element === 'TEMPLATE') {
              //  console.log(app1.content.children)
                Array.from(app1.content.children).forEach((child)=>{
                  newAppTree.push(fetchDomRender(child))
                })
             }
            // console.log(newAppTree,'n ewTree')
         
         // remove child element that doesn't exit with the element children 
       
         Array.from(app._tree.children).forEach((child) =>{
           
           let matched=false
           newAppTree.forEach((newChild) => {
             
             if (matched || newChild._tree.matched) {
               return
             }
               if (pawaCompare(child.el,newChild)) {
                 newChild._tree.matched=true
                 matched=true
                 newChild._tree.isMatched=true
                // later empty it
                 child.matchedNode=newChild
               }
           })
           if (matched) { // the element matched together tell the diff engine 
            //later make it false
            child.preRender=true
          }
          if (!matched) {
            // removeElement.push(child)
              const promised=new Promise((resolve)=>{
                child.el._deCompositionElement=true
                child.el._isKill=true
                child.el._remove(()=>resolve(true))
              })
              promisedArray.push(promised)
           }
         })
        
         newAppTree.forEach((child) => {
            child._tree.matched=false
         })
         Promise.all(promisedArray).then(()=>{//let animation run before adding
           if (app._tree.element === 'TEMPLATE') {
              forTemplateElement({app,app1,newAppTree,parent,parentTree})
           }
           // update the current dom element from the fetch element
           if ( app1.children.length > app._tree.children.length && app._tree.element !== 'TEMPLATE') {
             
             if (app._tree.children.length === 0) {
               Array.from(app1.children).forEach((child) => {
                  if (app._scriptFetching && app._scriptDone === false) {
                        app.innerHTML=app1.innerHTML
                       }else{              
                         app.appendChild(child)
                       }
                   requestAnimationFrame(() => {
                    if(app._tree.stateContext._hasRun){
                        app._tree.stateContext._hasRun=false
                        keepContext(app._tree.stateContext)
                      }
                       if (app._scriptFetching && app._scriptDone === false) {
                        app.innerHTML=app1.innerHTML
                       }else{
                       render(child,app._context,app._tree)
                       app._tree.stateContext._hasRun=true
                       }
                   })
               })
             } else {
               let lastMatched
               let siblings 
               const insertNewOne=[]
              //  console.log(app._tree)
               app._tree.children.forEach(child =>{
            //  let matched=false
             newAppTree.forEach((newChild,index) => {
               if (child.alreadyMatched) {
                 return
               }
               if (pawaCompare(child.el,newChild)) {
                 newAppTree.splice(index,1)
                 //  matched=true
                 lastMatched=child
                   child.alreadyMatched=true
                  //  console.log(child,newChild);
                   
                 } else {
                  // next step is to make sure that the element does not enter double 
                  if (!newChild._tree.inserted) {
                    newChild._tree.inserted=true
                    newChild._tree.beforeElement=child.el
                    insertNewOne.push({before:child.el,
                    newElement:newChild,parent:parent,remove:()=>newAppTree.splice(index,1)})
                 }
                  }
             })
             
           })
           app._tree.children.forEach(child =>{
            child.alreadyMatched=false
            
           })
           //insert the new element 
           if (insertNewOne.length > 0) {
            //  console.log(insertNewOne)
            insertNewOne.forEach(obj=>{
              if(obj.newElement._tree.isMatched){
                return
              }
              if(obj.before.isConnected){
                app.insertBefore(obj.newElement,obj.before)
              }else{
                app.insertBefore(obj.newElement,obj.before._underControl)
              }
              obj.remove()
              requestAnimationFrame(() => {
                      if(app._tree.stateContext._hasRun){
                        app._tree.stateContext._hasRun=false
                        keepContext(app._tree.stateContext)
                      }
                       if (app._scriptFetching && app._scriptDone === false) {
                        app.innerHTML=app1.innerHTML
                       }else{
                        render(obj.newElement,obj.parent._context,obj.parent._tree)
                       }
                      app._tree.stateContext._hasRun=true
                   })
            })
           }
           //insert the other element
           if (newAppTree.length > 0) {
            // console.log(lastMatched,app);
            siblings=lastMatched?.el?.nextElementSibling
            newAppTree.forEach((child) => {
              if(child._tree.isMatched){
                return
              }
              if (siblings) {
                app.insertBefore(child,siblings)
            requestAnimationFrame(() => {
             if(app._tree.stateContext._hasRun){
                        app._tree.stateContext._hasRun=false
                        keepContext(app._tree.stateContext)
                      }
                       if (app._scriptFetching && !app._scriptDone) {
                        app.innerHTML=app1.innerHTML
                       }else{
                render(child,parent._context,parent._tree)
                       }
                       app._tree.stateContext._hasRun=true
            })
  } else {
    // console.log(child._tree,app1._tree);
    if(child._tree.isMatched){
              return
            }
    parent.appendChild(child)
    requestAnimationFrame(() => {
       if(app._tree.stateContext._hasRun){
                        app._tree.stateContext._hasRun=false
                        keepContext(app._tree.stateContext)
                      }
                       if (app._scriptFetching && app._scriptDone === false) {
                        app.innerHTML=app1.innerHTML
                       }else{
        render(child,parent._context,parent._tree)
                       }
                       app._tree.stateContext._hasRun=true
    })
  }
             })
           }
             }
           }
           const preRenderTree=app._tree.children.filter(tree => tree.preRender=== true)
           
         preRenderTree.forEach((child) => {
             scheduleRender(() => {
                 pawaRender(child.el,child.matchedNode)
             })
         })

         })
         //later add for template too
       
       }
     }
      
      
      
    
}

const getTemplateElementParent=(el,callback)=>{
  if (el._tree.parent.element === 'TEMPLATE' ) {
    getTemplateElementParent(el._tree.parent.el)
  }else{
    callback(el._tree.parent.el)
  }
}
const forTemplateElement=({app1,app,newAppTree,parent,parentTree})=>{
  if ( app1.content.children.length > app._tree.children.length ) {
           
           if (app._tree.children.length === 0) {
             Array.from(app1.content.children).forEach((child) => {
              
                 getTemplateElementParent(app,(parent)=>parent.appendChild(child))
                 requestAnimationFrame(() => {
                   if(app._tree.stateContext._hasRun){
                      app._tree.stateContext._hasRun=false
                      keepContext(app._tree.stateContext)
                    }
                     if (app._scriptFetching && app._scriptDone === false) {
                      app.innerHTML=app1.innerHTML
                     }else{

                     render(child,parent._context,parent._tree)
                    }
                    app._tree.stateContext._hasRun=true
                 })
             })
           } else {
             let lastMatched
             let siblings 
             const insertNewOne=[]
             app._tree.children.forEach(child =>{
          //  let matched=false
           newAppTree.forEach((newChild,index) => {
             
             if (child.alreadyMatched) {
               return
             }
               if (pawaCompare(child.el,newChild)) {
                 newAppTree.splice(index,1)
                //  matched=true
                 child.alreadyMatched=true
                //  console.log(child,newChild);
                 
                 lastMatched=child
               } else {
                // next step is to make sure that the element does not enter double 
                insertNewOne.push({before:child.el,
                  newElement:newChild,parent:app,remove:()=>newAppTree.splice(index,1)})
               }
           })
           
         })
         //clear matched element from main dom element
         app._tree.children.forEach(child =>{
          child.alreadyMatched=false
          
         })
         //insert the new element 
         if (insertNewOne.length > 0) {
          insertNewOne.forEach(obj=>{
            consol.log(obj.before)
            getTemplateElementParent(app,(parent)=>parent.insertBefore(obj.newElement,obj.before))
            obj.remove()
            requestAnimationFrame(() => {
                     if(app._tree.stateContext._hasRun){
                      app._tree.stateContext._hasRun=false
                      keepContext(app._tree.stateContext)
                    }
                     if (app._scriptFetching && app._scriptDone === false) {
                      app.innerHTML=app1.innerHTML
                     }else{

                     render(obj.newElement,app._context,app._tree)
                     }
                     app._tree.stateContext._hasRun=true
                 })
          })
         }
         //insert the other element
         if (newAppTree.length > 0) {
           siblings=lastMatched.el.nextElementSibling
           newAppTree.forEach((child) => {
               if (siblings) {
          getTemplateElementParent(app,(parent)=>parent.insertBefore(child,siblings))
          requestAnimationFrame(() => { 
            if(app._tree.stateContext._hasRun){
                      app._tree.stateContext._hasRun=false
                      keepContext(app._tree.stateContext)
                    }
                     if (app._scriptFetching && app._scriptDone === false) {
                      app.innerHTML=app1.innerHTML
                     }else{
              render(child,app._context,app._tree)
                     }
                     app._tree.stateContext=true
          })
} else {
  getTemplateElementParent(app,(parent)=> parent.appendChild(child))
  requestAnimationFrame(() => {
  if(app._tree.stateContext._hasRun){
                      app._tree.stateContext._hasRun=false
                      keepContext(app._tree.stateContext)
                    }
                     if (app._scriptFetching && app._scriptDone === false) {
                      app.innerHTML=app1.innerHTML
                     }else{
      render(child,app._context,app._tree)
                     }
                     app._tree.stateContext=true
  })
}
           })
         }
           }
         }
}