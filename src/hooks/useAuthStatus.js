import React, { useEffect, useState, useRef } from 'react';
import { auth } from '../firebase.config';
import { onAuthStateChanged } from 'firebase/auth';

export const useAuthStatus = () => {
	const [loggedIn, setLoggedIn] = useState(false);
	const [checkingStatus, setCheckingStatus] = useState(true);
	const isMounted = useRef(true); // this useRef is to handle memory leak errors.

	useEffect(() => {
		if (isMounted) {
			onAuthStateChanged(auth, user => {
				if (user) {
					setLoggedIn(true);
				}

				setCheckingStatus(false);
			});
		}

		return () => {
			isMounted.current = false;
		};
	}, [isMounted]);

	return { loggedIn, checkingStatus };
};
