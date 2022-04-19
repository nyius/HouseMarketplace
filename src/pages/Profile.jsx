import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase.config';
import { updateProfile } from 'firebase/auth';
import { updateDoc, doc, collection, getDocs, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase.config';
import { toast } from 'react-toastify';
import arrowRight from '../assets/svg/keyboardArrowRightIcon.svg';
import homeIcon from '../assets/svg/homeIcon.svg';
import ListingItem from '../components/ListingItem';

function Profile() {
	const navigate = useNavigate();
	const [changeDetails, setChangeDetails] = useState(false);
	const [listings, setListings] = useState(null);
	const [loading, setLoading] = useState(true);
	const [formData, setFormData] = useState({
		name: auth.currentUser.displayName,
		email: auth.currentUser.email,
	});

	const { name, email } = formData;

	useEffect(() => {
		const fetchUserListings = async () => {
			const listingsRef = collection(db, 'listings');
			const q = query(listingsRef, where('userRef', '==', auth.currentUser.uid), orderBy('timestamp', 'desc'));
			const querySnap = await getDocs(q);

			let listings = [];
			querySnap.forEach(doc => {
				return listings.push({
					id: doc.id,
					data: doc.data(),
				});
			});
			setListings(listings);
			setLoading(false);
		};

		fetchUserListings();
	}, [auth.currentUser.uid]);

	const onLogout = e => {
		auth.signOut();
		navigate('/');
	};

	const onSubmit = async e => {
		try {
			if (auth.currentUser.displayName !== name) {
				//update displayname
				await updateProfile(auth.currentUser, {
					displayName: name,
				});

				// update in firstore
				// here we say that we want to grab a reference in our users collection to the current user
				const userRef = doc(db, 'users', auth.currentUser.uid);
				// now we want to update that refrence with new data (here we want to change the name parameter to our name field)
				await updateDoc(userRef, {
					name,
				});
			}
		} catch (error) {
			toast.error(`Couldn't update your information. Please try again later`);
		}
	};

	const onChange = e => {
		setFormData(prevState => ({
			...prevState,
			[e.target.id]: e.target.value,
		}));
	};

	const onDelete = async listingId => {
		if (window.confirm('Are you sure you want to delete this listing?')) {
			await deleteDoc(doc(db, 'listings', listingId));
			const updatedListings = listings.filter(listing => listing.id !== listingId);
			setListings(updatedListings);
			toast.success('Listing deleted!');
		}
	};

	const onEdit = listingId => {
		navigate(`/edit-listing/${listingId}`);
	};

	return (
		<div className="profile">
			<header className="profileHeader">
				<p className="pageHeader">My Profile</p>
				<button type="button" onClick={onLogout} className="logOut">
					Logout
				</button>
			</header>
			<main>
				<div className="profileDetailsHeader">
					<p className="profileDetailsText">Personal Details</p>
					<p
						className="changePersonalDetails"
						onClick={() => {
							changeDetails && onSubmit();
							setChangeDetails(!changeDetails);
						}}
					>
						{changeDetails ? 'done' : 'change'}
					</p>
				</div>
				<div className="profileCard">
					<form>
						<input
							type="text"
							className={!changeDetails ? 'profileName' : 'profileNameActive'}
							id="name"
							disabled={!changeDetails}
							value={name}
							onChange={onChange}
						/>
						<input
							type="text"
							className={!changeDetails ? 'profileEmail' : 'profileEmailActive'}
							id="email"
							disabled={!changeDetails}
							value={email}
							onChange={onChange}
						/>
					</form>
				</div>
				<Link to="/create-listing" className="createListing">
					<img src={homeIcon} alt="hoem" />
					<p>Sell or Rent Your Home</p>
					<img src={arrowRight} alt="arrow right" />
				</Link>

				{!loading && listings?.length > 0 && (
					<>
						<p className="listingText">Your Listings</p>
						<ul className="listingsList">
							{listings.map(listing => (
								<ListingItem
									key={listing.id}
									listing={listing.data}
									id={listing.id}
									onDelete={() => onDelete(listing.id)}
									onEdit={() => onEdit(listing.id)}
								/>
							))}
						</ul>
					</>
				)}
			</main>
		</div>
	);
}

export default Profile;
