import { RouterProvider } from "react-router-dom";

import router from "./Route";


export default function App() {
  return (
    <div>
      <RouterProvider router={router}/>
      
    </div>
        
    
  );
}