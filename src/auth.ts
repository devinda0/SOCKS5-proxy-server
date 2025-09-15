import {
    AUTH_USERNAME,
    AUTH_PASSWORD
} from './config';

export const authenticate = (username: string, password: string): boolean => {
    return username === AUTH_USERNAME && password === AUTH_PASSWORD;
}