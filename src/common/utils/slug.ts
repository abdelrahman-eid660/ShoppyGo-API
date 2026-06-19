export const generateSlug =  (value : string)=>{
    return value.replaceAll(/\s+/g , "-")
}