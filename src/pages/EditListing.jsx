import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { auth, db, storage } from '../firebase.config';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

function EditListing() {
	const [geolocationEnabled, setGeolocationEnabled] = useState(true);
	const [loading, setLoading] = useState(false);
	const [listing, setListing] = useState(false);
	const [formData, setFormData] = useState({
		type: 'rent',
		name: '',
		bedrooms: 1,
		bathrooms: 1,
		parking: false,
		furnished: false,
		address: '',
		offer: false,
		regularPrice: 0,
		discountedPrice: 0,
		imageUrls: {},
		latitude: 0,
		longitude: 0,
	});

	const {
		type,
		name,
		bedrooms,
		bathrooms,
		parking,
		furnished,
		address,
		offer,
		regularPrice,
		discountedPrice,
		imageUrls,
		latitude,
		longitude,
	} = formData;

	const navigate = useNavigate();
	const params = useParams();
	const isMounted = useRef(true);

	// Redirect if listing is not users
	useEffect(() => {
		if (listing && listing.userRef !== auth.currentUser.uid) {
			toast.error(`You cannot edit this listing`);
			navigate('/');
		}
	}, []);

	// Sets listing to edit
	useEffect(() => {
		setLoading(true);
		const fetchListing = async () => {
			const docRef = doc(db, 'listings', params.listingId);
			const docSnap = await getDoc(docRef);
			if (docSnap.exists()) {
				setListing(docSnap.data());
				setFormData({ ...docSnap.data(), address: docSnap.data().location });
				setLoading(false);
			} else {
				navigate('/');
				toast.error('Could not find listing to edit');
			}
		};

		fetchListing();
	}, [params.listingId, navigate]);

	// Sets userRef to loged in user
	useEffect(() => {
		if (isMounted) {
			onAuthStateChanged(auth, user => {
				if (user) {
					setFormData({ ...formData, userRef: user.uid });
				} else {
					navigate('/sign-in');
				}
			});
		}

		return () => {
			isMounted.current = false;
		};
	}, [isMounted]);

	const onSubmit = async e => {
		e.preventDefault();

		setLoading(true);

		if (discountedPrice >= regularPrice) {
			setLoading(false);
			toast.error('Discount must be lower than the regular price');
			return;
		}

		if (imageUrls.length > 6) {
			setLoading(false);
			toast.error('Max. 6 images');
			return;
		}

		let geolocation = {};
		let location;
		if (geolocationEnabled) {
			const response = await fetch(
				`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.REACT_APP_GEOCODE_API_KEY}`
			);

			const data = await response.json();

			geolocation.lat = data.results[0]?.geometry.location.lat ?? 0;
			geolocation.lng = data.results[0]?.geometry.location.lng ?? 0;

			location = data.status === 'ZERO_RESULTS' ? undefined : data.results[0]?.formatted_address;

			if (location === 'undefined' || location.includes('undefined')) {
				setLoading('false');
				toast.error('Please enter a correct address');
				return;
			}
		} else {
			geolocation.lat = latitude;
			geolocation.lng = longitude;
			location = address;
		}

		// Store images in firebase
		const storeImage = async image => {
			return new Promise((resolve, reject) => {
				const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;

				const storageRef = ref(storage, 'images/' + fileName);
				const uploadTask = uploadBytesResumable(storageRef, image);

				// Listen for state changes, errors, and completion of the upload.
				uploadTask.on(
					'state_changed',
					snapshot => {
						// Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
						const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
						console.log('Upload is ' + progress + '% done');
						switch (snapshot.state) {
							case 'paused':
								console.log('Upload is paused');
								break;
							case 'running':
								console.log('Upload is running');
								break;
						}
					},
					error => {
						// A full list of error codes is available at
						// https://firebase.google.com/docs/storage/web/handle-errors
						switch (error.code) {
							case 'storage/unauthorized':
								toast.error(`You don't have permission to do that`);
								reject(error);
								break;
							case 'storage/canceled':
								toast.error('Upload cancelled');
								reject(error);
								break;
							case 'storage/unknown':
								toast.error(`Upload failed. Please try again`);
								reject(error);
								break;
						}
					},
					() => {
						// Upload completed successfully, now we can get the download URL
						getDownloadURL(uploadTask.snapshot.ref).then(downloadURL => {
							resolve(downloadURL);
						});
					}
				);
			});
		};

		const imgUrls = await Promise.all([...imageUrls].map(img => storeImage(img))).catch(() => {
			setLoading(false);
			toast.error('Images not uploaded');
			return;
		});

		const formDataCopy = {
			...formData,
			imageUrls: imgUrls,
			geolocation,
			timestamp: serverTimestamp(),
		};

		formDataCopy.location = address;
		delete formDataCopy.address;
		!formDataCopy.offer && delete formDataCopy.discountedPrice;

		// update listing
		const docRef = doc(db, 'listings', params.listingId);
		await updateDoc(docRef, formDataCopy);
		setLoading(false);
		toast.success('Listing saved');

		navigate(`/category/${formDataCopy.type}/${docRef.id}`);
	};

	const onMutate = e => {
		let boolean = null;

		if (e.target.value === 'true') {
			boolean = true;
		}
		if (e.target.value === 'false') {
			boolean = false;
		}

		//files
		if (e.target.files) {
			setFormData(prevState => ({
				...prevState,
				imageUrls: e.target.files,
			}));
		}

		//text/booleans/numbers
		if (!e.target.files) {
			setFormData(prevState => ({
				...prevState,
				[e.target.id]: boolean ?? e.target.value,
			}));
		}
	};

	if (loading) {
		return <Spinner />;
	}

	return (
		<div className="profiel">
			<header>
				<p className="pageHeader">Edit Listing</p>
			</header>

			<main>
				<form onSubmit={onSubmit}>
					<label className="formLabel">Sell / Rent</label>
					<div className="formButtons">
						<button
							type="button"
							className={type === 'sale' ? 'formButtonActive' : 'formButton'}
							id="type"
							value="sale"
							onClick={onMutate}
						>
							Sell
						</button>
						<button
							type="button"
							className={type === 'rent' ? 'formButtonActive' : 'formButton'}
							id="type"
							value="rent"
							onClick={onMutate}
						>
							Rent
						</button>
					</div>

					<label className="formLabel">Name</label>
					<input
						className="formInputName"
						type="text"
						id="name"
						value={name}
						onChange={onMutate}
						maxLength="32"
						minLength="10"
						required
					/>

					<div className="formRooms flex">
						<div>
							<label className="formLabel">Bedrooms</label>
							<input
								className="formInputSmall"
								type="number"
								id="bedrooms"
								value={bedrooms}
								onChange={onMutate}
								min="1"
								max="50"
								required
							/>
						</div>
						<div>
							<label className="formLabel">Bathrooms</label>
							<input
								className="formInputSmall"
								type="number"
								id="bathrooms"
								value={bathrooms}
								onChange={onMutate}
								min="1"
								max="50"
								required
							/>
						</div>
					</div>

					<label className="formLabel">Parking spot</label>
					<div className="formButtons">
						<button
							className={parking ? 'formButtonActive' : 'formButton'}
							type="button"
							id="parking"
							value={true}
							onClick={onMutate}
							min="1"
							max="50"
						>
							Yes
						</button>
						<button
							className={!parking && parking !== null ? 'formButtonActive' : 'formButton'}
							type="button"
							id="parking"
							value={false}
							onClick={onMutate}
						>
							No
						</button>
					</div>

					<label className="formLabel">Furnished</label>
					<div className="formButtons">
						<button
							className={furnished ? 'formButtonActive' : 'formButton'}
							type="button"
							id="furnished"
							value={true}
							onClick={onMutate}
						>
							Yes
						</button>
						<button
							className={!furnished && furnished !== null ? 'formButtonActive' : 'formButton'}
							type="button"
							id="furnished"
							value={false}
							onClick={onMutate}
						>
							No
						</button>
					</div>

					<label className="formLabel">Address</label>
					<textarea
						className="formInputAddress"
						type="text"
						id="address"
						value={address}
						onChange={onMutate}
						required
					/>

					{!geolocationEnabled && (
						<div className="formLatLng flex">
							<div>
								<label className="formLabel">Latitude</label>
								<input
									className="formInputSmall"
									type="number"
									id="latitude"
									value={latitude}
									onChange={onMutate}
									required
								/>
							</div>
							<div>
								<label className="formLabel">Longitude</label>
								<input
									className="formInputSmall"
									type="number"
									id="longitude"
									value={longitude}
									onChange={onMutate}
									required
								/>
							</div>
						</div>
					)}

					<label className="formLabel">Offer</label>
					<div className="formButtons">
						<button
							className={offer ? 'formButtonActive' : 'formButton'}
							type="button"
							id="offer"
							value={true}
							onClick={onMutate}
						>
							Yes
						</button>
						<button
							className={!offer && offer !== null ? 'formButtonActive' : 'formButton'}
							type="button"
							id="offer"
							value={false}
							onClick={onMutate}
						>
							No
						</button>
					</div>

					<label className="formLabel">Regular Price</label>
					<div className="formPriceDiv">
						<input
							className="formInputSmall"
							type="number"
							id="regularPrice"
							value={regularPrice}
							onChange={onMutate}
							min="50"
							max="750000000"
							required
						/>
						{type === 'rent' && <p className="formPriceText">$ / Month</p>}
					</div>

					{offer && (
						<>
							<label className="formLabel">Discounted Price</label>
							<input
								className="formInputSmall"
								type="number"
								id="discountedPrice"
								value={discountedPrice}
								onChange={onMutate}
								min="50"
								max="750000000"
								required={offer}
							/>
						</>
					)}

					<label className="formLabel">Images</label>
					<p className="imagesInfo">The first image will be the cover (max 6).</p>
					<input
						className="formInputFile"
						type="file"
						id="images"
						onChange={onMutate}
						max="6"
						accept=".jpg,.png,.jpeg"
						multiple
						required
					/>
					<button type="submit" className="primaryButton createListingButton">
						Edit Listing
					</button>
				</form>
			</main>
		</div>
	);
}

export default EditListing;
