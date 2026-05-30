import { useEffect, useState } from "react";


const  Usegeturl = (url) => {
const [data, setdata] = useState([]);

useEffect(() => {
    fetchurl(url)
}, [url]);


const fetchurl =(url)=>{
fetch(url)
.then((res)=>res.json())
.then((res)=>setdata(res)) 
}
return data
}






export default Usegeturl