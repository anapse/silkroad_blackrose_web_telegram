import { useEffect, useState } from "react";

const ValidarID = (ID) => {
  const [data2, setdata2] = useState([]);
  const url = 'http://144.126.130.104:100/existe/' + ID;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }
        const result = await response.json();
        setdata2(result);
      } catch (error) {
        // Error fetching data
      }
    };

    fetchData();
  }, [url, ID]);

  return data2;
};

export default ValidarID;
