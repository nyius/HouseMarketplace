import { toast } from 'react-toastify';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ReactComponent as ArrowRightIcon } from '../assets/svg/keyboardArrowRightIcon.svg';
import visibilityIcon from '../assets/svg/visibilityIcon.svg';
import { signInWithEmailAndPassword, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase.config';
import OAuth from '../components/OAuth';

function SignIn() {
	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});

	const { email, password } = formData;

	const navigate = useNavigate();

	const onChange = e => {
		setFormData(prevState => ({
			...prevState,
			[e.target.id]: e.target.value,
		}));
	};

	const onSubmit = async e => {
		e.preventDefault();

		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);

			if (userCredential.user) {
				navigate('/');
			}
		} catch (error) {
			toast.error('Username/password incorrect');
		}
	};

	return (
		<>
			<div className="pageCOntainer">
				<header>
					<p className="pageHeader">Welcome back!</p>
				</header>

				<main>
					<form onSubmit={onSubmit}>
						<input
							type="email"
							className="emailInput"
							placeholder="Email"
							id="email"
							defaultValue={email}
							onChange={onChange}
						/>
						<div className="passwordInputDiv">
							<input
								type={showPassword ? 'text' : 'password'}
								className="passwordInput"
								placeholder="password"
								id="password"
								defaultValue={password}
								onChange={onChange}
							/>
							<img
								src={visibilityIcon}
								alt="show password"
								className="showPassword"
								onClick={() => setShowPassword(prevState => !prevState)}
							/>
						</div>
						<Link to="/forgot-password" className="forgotPasswordLink">
							Forgot Password
						</Link>

						<div className="signInBar">
							<p className="signInText">Sign In</p>
							<button className="signInButton">
								<ArrowRightIcon fill="#ffffff" width="34px" height="34px" />
							</button>
						</div>
					</form>

					<OAuth />
					<Link to="/sign-up" className="registerLink">
						Sign Up Instead
					</Link>
				</main>
			</div>
		</>
	);
}

export default SignIn;
