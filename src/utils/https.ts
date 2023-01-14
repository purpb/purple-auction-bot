import axios from 'axios'
import { appBearerToken } from '../config'

export const safeGET: any = async (url: string, fcHeader=false) => {
  var headers: any = {}
  if(fcHeader) { 
    headers = {
      headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${appBearerToken}`,
          'Content-Type': 'application/json',
      }
    }
  }
    try {
      return await axios.get<any>(url, headers)
    } catch(error: any){
      console.log(`Error when visiting ${url}, ${error}`)
      return null
    }
  }
  
export const safePOST: any = async (url: string, data: any, fcHeader=false) => {
    var headers: any = {}
    if(fcHeader) { 
      headers = {
        headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${appBearerToken}`,
            'Content-Type': 'application/json',
        }
      }
    }
    try {
      return await axios.post<any>(url, data, headers)
    } catch(error: any){
      console.log(`Error when visiting ${url}, ${error}`)
      return null
    }
  }