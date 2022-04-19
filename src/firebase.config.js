// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyBQN1UP6ZsVyinzhLDkfjUmWvRjmGudxN4',
	authDomain: 'housemarketplaceapp-84f0b.firebaseapp.com',
	projectId: 'housemarketplaceapp-84f0b',
	storageBucket: 'housemarketplaceapp-84f0b.appspot.com',
	messagingSenderId: '432666605687',
	appId: '1:432666605687:web:87df45e3a43e4d13d9ae72',
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const db = getFirestore();
export const auth = getAuth();
export const storage = getStorage();
