import react from "react";
import { ThreeDots } from "react-loader-spinner";

 const BtnLoader = () => {
    
    return(<ThreeDots
        visible={true}
        height="20"
        width="110"
        color="white"
        radius="9"
        ariaLabel="three-dots-loading"
        wrapperStyle={{}}
        wrapperClass=""
        />)
}

export default BtnLoader


