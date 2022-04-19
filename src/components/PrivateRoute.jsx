import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStatus } from '../hooks/useAuthStatus';
import Spinner from '../components/Spinner';

const PrivateRoute = ({ children }) => {
	const { loggedIn, checkingStatus } = useAuthStatus();

	if (checkingStatus) {
		return <Spinner />;
	}

	return loggedIn ? children : <Navigate to="/sign-in" />;
};

export default PrivateRoute;
