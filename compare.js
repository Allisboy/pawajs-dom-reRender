export function isShallowEqual(a, b) {
  
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length){
    // console.log(a,b)
    return false;
  }

  return aKeys.every(key => a[key] === b[key]);
}

export const pawaCompare=(arg1,arg2) => {
  
    if (arg1._tree.element === arg2._tree.element && isShallowEqual(arg1._tree.pawaAttributes,arg2._tree.pawaAttributes) && arg1._tree.isComponent === arg2._tree.isComponent &&  arg1._tree.componentName === arg2._tree.componentName && arg1._pawaElementComponentName === arg2._pawaElementComponentName) {
      return true
    } else {
      // console.log(arg1,arg2)
      return false
    }
}