import axios from 'axios';
import { httpClient } from '../httpClients/httpClients.js';

export const getProfiles = ( ) => new Promise((resolve, reject) => {
    axios.get(`https://localhost:44311/api/services/app/Profile/GetAllProfile`)
    .then((response) =>{
        resolve(response.data)
        // console.log(response.data)
    })
    .catch(error => {
        reject(error)
        console.log("Error getting all Profiles");
    })
})



export const GetProfileByIdAsync = (id) => new Promise((resolve, reject) => {
    httpClient.get(`/Profile/GetProfileById?profileId=${id}`)
    .then((response) =>{
        resolve(response.data)
    })
    .catch(error => {
        reject(error)
        console.log("Error getting all profiles");
    })
})
