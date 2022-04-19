import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase.config';
import { toast } from 'react-toastify';
import Spinner from '../components/Spinner';
import ListingItem from '../components/ListingItem';

export default function Category() {
	const [listings, setListings] = useState(null);
	const [loading, setloading] = useState(true);
	const [lastFetchedListing, setLastFetchedListing] = useState(null);

	const params = useParams();

	useEffect(() => {
		const fetchListings = async () => {
			try {
				// get reference
				const listingsRef = collection(db, 'listings');

				// Create a query
				const q = query(
					listingsRef,
					where('type', '==', params.categoryName),
					orderBy('timestamp', 'desc', limit(10)),
					limit(10)
				);

				// now query the database
				const querySnap = await getDocs(q);

				const lastVisible = querySnap.docs[querySnap.docs.length - 1];
				setLastFetchedListing(lastVisible);

				const listings = [];

				querySnap.forEach(doc => {
					return listings.push({
						id: doc.id,
						data: doc.data(),
					});
				});

				setListings(listings);
				setloading(false);
			} catch (error) {
				toast.error('Could not fetch listings');
			}
		};

		fetchListings();
	}, []);

	const onFetchMoreListings = async () => {
		try {
			// get reference
			const listingsRef = collection(db, 'listings');

			// Create a query
			const q = query(
				listingsRef,
				where('type', '==', params.categoryName),
				orderBy('timestamp', 'desc', limit(10)),
				startAfter(lastFetchedListing),
				limit(10)
			);

			// now query the database
			const querySnap = await getDocs(q);

			const lastVisible = querySnap.docs[querySnap.docs.length - 1];
			setLastFetchedListing(lastVisible);

			const listings = [];

			querySnap.forEach(doc => {
				return listings.push({
					id: doc.id,
					data: doc.data(),
				});
			});

			setListings(prevState => [...prevState, ...listings]);
			setloading(false);
		} catch (error) {
			toast.error('Could not fetch listings');
		}
	};

	return (
		<div className="category">
			<header>
				<p className="pageHeader">{params.categoryName === 'rent' ? 'Places for Rent' : 'Places for Sale'}</p>
			</header>
			{loading ? (
				<Spinner />
			) : listings && listings.length > 0 ? (
				<>
					<main>
						<ul className="categoryListings">
							{listings.map((listing, i) => {
								return <ListingItem listing={listing.data} id={listing.id} key={listing.id} />;
							})}
						</ul>
					</main>

					<br />
					<br />
					{lastFetchedListing && (
						<p className="loadMore" onClick={onFetchMoreListings}>
							Load more
						</p>
					)}
				</>
			) : (
				<p>No listings for {params.categoryName} </p>
			)}
		</div>
	);
}
