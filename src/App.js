import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Explore from './pages/Explore';
import CreateListing from './pages/CreateListing';
import Listing from './pages/Listing';
import Offers from './pages/Offers';
import Profile from './pages/Profile';
import Category from './pages/Category';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Contact from './pages/Contact';
import EditListing from './pages/EditListing';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';

function App() {
	return (
		<>
			<Router>
				<Routes>
					<Route path="/" element={<Explore />} />
					<Route exact path="/offers" element={<Offers />} />
					<Route exact path="/category/:categoryName" element={<Category />} />
					<Route exact path="/category/:categoryName/:listingId" element={<Listing />} />
					<Route
						exact
						path="/profile"
						element={
							<PrivateRoute>
								<Profile />
							</PrivateRoute>
						}
					/>
					<Route exact path="/sign-in" element={<SignIn />} />
					<Route exact path="/sign-up" element={<SignUp />} />
					<Route exact path="/forgot-password" element={<ForgotPassword />} />
					<Route exact path="/contact/:landlordId" element={<Contact />} />
					<Route exact path="/create-listing" element={<CreateListing />} />
					<Route exact path="/edit-listing/:listingId" element={<EditListing />} />
					<Route exact path="/*" element={<NotFound />} />
				</Routes>
				<Navbar />
			</Router>
			<ToastContainer />
		</>
	);
}

export default App;
