export function useRouter(){return {push:(path:string)=>{location.hash=path},replace:(path:string)=>{location.replace("#"+path)}}}
export function useParams<T>(){return {id:location.hash.split("/")[2]||""} as T}
