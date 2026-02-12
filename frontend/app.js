const { useState, useEffect, createContext, useContext } = React;

// --- API Configuration ---
const api = axios.create({
    baseURL: '', // Empty string uses current origin
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- Auth Context ---
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                } catch (err) {
                    console.error("Auth check failed", err);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.access_token);
        setUser(res.data.user);
    };

    const register = async (userData) => {
        const res = await api.post('/auth/register', userData);
        localStorage.setItem('token', res.data.access_token);
        setUser(res.data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

// --- Simple Custom Cursor & Ripple ---
const CustomCursor = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [clicked, setClicked] = useState(false);

    useEffect(() => {
        const moveCursor = (e) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };
        const mouseDown = () => setClicked(true);
        const mouseUp = () => setClicked(false);

        // Ripple Effect
        const createRipple = (e) => {
            const ripple = document.createElement("div");
            ripple.classList.add("ripple");
            document.body.appendChild(ripple);
            ripple.style.left = `${e.clientX}px`;
            ripple.style.top = `${e.clientY}px`;
            ripple.addEventListener("animationend", () => {
                document.body.removeChild(ripple);
            });
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mousedown', mouseDown);
        window.addEventListener('mouseup', mouseUp);
        window.addEventListener('click', createRipple);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mousedown', mouseDown);
            window.removeEventListener('mouseup', mouseUp);
            window.removeEventListener('click', createRipple);
        };
    }, []);

    // Only render on non-touch devices
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        setIsTouch(!window.matchMedia('(hover: hover)').matches);
    }, []);

    if (isTouch) return null;

    return ReactDOM.createPortal(
        <>
            <div className="cursor-dot" style={{ left: `${position.x}px`, top: `${position.y}px` }}></div>
            <div
                className="cursor-outline"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    transform: `translate(-50%, -50%) scale(${clicked ? 0.8 : 1})`
                }}
            ></div>
        </>,
        document.getElementById('cursor-root') || document.body
    );
};

// --- Components ---

const Navbar = ({ setPage }) => {
    const { user, logout } = useAuth();
    return (
        <nav className="glass-panel sticky top-0 z-50 border-b border-white/5 hidden md:block backdrop-blur-md bg-[#09090b]/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    <div className="flex cursor-pointer items-center space-x-3 group" onClick={() => setPage('home')}>
                        <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
                            <span className="text-2xl">⚡</span>
                        </div>
                        <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400 tracking-tighter">
                            ElectroRecover
                        </span>
                    </div>
                    <div className="flex items-center space-x-8">
                        <button onClick={() => setPage('home')} className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Browse</button>
                        {user ? (
                            <>
                                <button onClick={() => setPage('dashboard')} className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Dashboard</button>
                                {user.role === 'admin' && (
                                    <button onClick={() => setPage('admin')} className="text-sm font-extrabold text-primary hover:text-primary-light tracking-wide">ADMIN</button>
                                )}
                                <div className="flex items-center space-x-4 border-l pl-6 ml-2 border-white/5">
                                    <span className="text-sm font-medium text-zinc-500">Hi, <span className="text-white font-bold">{user.name.split(' ')[0]}</span></span>
                                    <button onClick={() => setPage('create-listing')} className="btn-primary text-black px-6 py-2.5 text-sm rounded-full shadow-lg shadow-white/5 hover:shadow-white/20 whitespace-nowrap">
                                        + Sell Item
                                    </button>
                                    <button onClick={logout} className="text-sm text-zinc-500 hover:text-red-400 font-medium transition-colors">Logout</button>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <button onClick={() => setPage('login')} className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Login</button>
                                <button onClick={() => setPage('register')} className="btn-primary text-black px-6 py-2.5 text-sm rounded-full shadow-lg shadow-white/5">
                                    Join Now
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

const MobileTopBar = ({ setPage }) => {
    return (
        <div className="md:hidden sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex justify-between items-center">
            <div className="flex cursor-pointer items-center space-x-2" onClick={() => setPage('home')}>
                <div className="bg-primary/20 p-1.5 rounded-lg">
                    <span className="text-xl">⚡</span>
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                    ElectroRecover
                </span>
            </div>
            {/* Placeholder for notification or profile icon if needed */}
            <div className="w-8"></div>
        </div>
    );
};

const MobileBottomNav = ({ setPage, page }) => {
    const { user } = useAuth();

    const NavItem = ({ target, icon, label, active }) => (
        <button
            onClick={() => setPage(target)}
            className={`flex flex-col items-center justify-center w-full py-2 transition-all duration-300 ${active ? 'text-primary' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
            <span className={`text-xl mb-1 transition-transform ${active ? 'scale-110' : ''}`}>{icon}</span>
            <span className="text-[10px] font-bold tracking-wide">{label}</span>
        </button>
    );

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090b] border-t border-white/5 pb-safe shadow-2xl">
            <div className="flex justify-around items-center h-16">
                <NavItem target="home" icon="🏠" label="Home" active={page === 'home'} />
                <NavItem target="create-listing" icon="➕" label="Sell" active={page === 'create-listing'} />
                {user ? (
                    <>
                        <NavItem target="dashboard" icon="📊" label="Dashboard" active={page === 'dashboard'} />
                    </>
                ) : (
                    <NavItem target="login" icon="🔐" label="Login" active={page === 'login' || page === 'register'} />
                )}
            </div>
        </div>
    );
};

const ProductDetailsModal = ({ listing, onClose, onRequest }) => {
    const { user } = useAuth();
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [hasRequested, setHasRequested] = useState(false);

    useEffect(() => {
        if (user && listing) {
            api.get('/requests/my-requests').then(res => {
                const existing = res.data.find(r => r.listing_id === listing.id && r.status === 'pending');
                if (existing) setHasRequested(true);
            }).catch(console.error);
        }
    }, [user, listing]);

    if (!listing) return null;

    const photos = listing.photos && listing.photos.length > 0 ? listing.photos : [];

    return (
        <div className="fixed inset-0 z-[100] flex md:items-center justify-center bg-black/90 backdrop-blur-xl animate-fade-in md:p-8">
            <div className="bg-[#09090b] w-full max-w-7xl h-full md:h-[90vh] md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative animate-scale-up border border-white/5">

                {/* Close Button (Mobile Absolute / Desktop Absolute) */}
                <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur p-2 rounded-full text-white hover:bg-white/20 transition-all">
                    <span className="text-xl">✕</span>
                </button>

                {/* Left: Image Gallery */}
                <div className="w-full md:w-[55%] bg-black relative flex flex-col items-center justify-center p-4 md:p-8 group">
                    <div className="flex-1 w-full flex items-center justify-center relative">
                        {photos.length > 0 ? (
                            <img src={photos[activeImageIndex]} alt={listing.title} className="max-w-full max-h-[40vh] md:max-h-[70vh] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                            <div className="text-zinc-600 flex flex-col items-center">
                                <span className="text-6xl mb-4 opacity-30">📷</span>
                                <span className="font-medium text-lg">No Images</span>
                            </div>
                        )}
                    </div>

                    {/* Thumbnails */}
                    {photos.length > 1 && (
                        <div className="flex space-x-3 overflow-x-auto pb-2 custom-scrollbar justify-center w-full px-4 mt-6 absolute bottom-6 z-10">
                            {photos.map((photo, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImageIndex(idx)}
                                    className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300 ${activeImageIndex === idx ? 'border-primary ring-2 ring-primary/30 scale-105 opacity-100' : 'border-transparent opacity-50 hover:opacity-100 hover:border-zinc-700 bg-zinc-900'}`}
                                >
                                    <img src={photo} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Details */}
                <div className="w-full md:w-[45%] flex flex-col bg-[#09090b] border-l border-white/5 relative">
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar pb-32 md:pb-10">
                        {/* Header */}
                        <div className="mb-8">
                            <span className="inline-flex items-center space-x-2 text-xs font-bold text-primary-light uppercase tracking-widest mb-3">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                <span>{listing.category}</span>
                            </span>
                            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-3 tracking-tight">{listing.title}</h2>
                            <p className="text-zinc-400 font-medium text-lg">{listing.brand} {listing.model}</p>
                        </div>

                        {/* Price Tag */}
                        <div className="mb-10 flex items-end space-x-4 border-b border-white/5 pb-8">
                            <div className="flex flex-col">
                                <span className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Price</span>
                                <span className="text-5xl font-bold text-primary tracking-tighter">₹{Math.floor(listing.price).toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Condition</h3>
                                <div className={`text-lg font-bold ${listing.condition === 'broken' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {listing.condition.replace('_', ' ').toUpperCase()}
                                </div>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Location</h3>
                                <div className="text-lg font-medium text-zinc-200 truncate">{listing.location}</div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Details</h3>
                                <p className="text-zinc-400 leading-relaxed text-lg font-light">{listing.description}</p>
                            </div>

                            {listing.working_parts && (
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Working Logic</h3>
                                    <div className="text-emerald-300 bg-emerald-950/10 p-5 rounded-2xl border border-emerald-900/20 flex items-start space-x-3">
                                        <span className="text-xl">✅</span>
                                        <span className="font-medium text-base">{listing.working_parts}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sticky Bottom Action (Mobile) / Footer Action (Desktop) */}
                    <div className="bg-[#09090b]/80 backdrop-blur-md p-6 border-t border-white/10 absolute md:static bottom-0 left-0 right-0 z-20">
                        {listing.status === 'active' ? (
                            (() => {
                                const isOwner = user && user.id === listing.seller_id;
                                if (isOwner) {
                                    return <button disabled className="w-full bg-zinc-800 text-zinc-500 py-4 rounded-xl font-bold text-lg cursor-not-allowed">You Own This Item</button>;
                                }
                                if (hasRequested) {
                                    return <button disabled className="w-full bg-primary/10 text-primary py-4 rounded-xl font-bold text-lg cursor-not-allowed border border-primary/20">Request Pending...</button>;
                                }
                                return (
                                    <button
                                        onClick={() => {
                                            onRequest(listing.id);
                                            setHasRequested(true);
                                        }}
                                        className="w-full btn-primary text-black py-4 rounded-xl font-bold text-xl hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-white/5"
                                    >
                                        Send Purchase Request
                                    </button>
                                );
                            })()
                        ) : (
                            <button disabled className="w-full bg-zinc-800 text-zinc-500 py-4 rounded-xl font-bold text-lg cursor-not-allowed">
                                Item Sold
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ListingCard = ({ listing, onView }) => {
    const isSold = listing.status === 'sold';

    return (
        <div
            className={`group relative bg-[#09090b] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 border border-white/5 ${isSold ? 'opacity-60 grayscale hover:opacity-100' : 'hover:-translate-y-1'}`}
            onClick={() => onView(listing)}
        >
            {/* Image Container - Full Bleed */}
            <div className="aspect-[4/3] relative overflow-hidden bg-zinc-900">
                {listing.photos && listing.photos.length > 0 ? (
                    <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                    <div className="flex items-center justify-center w-full h-full text-zinc-700">
                        <span className="text-4xl text-zinc-800">📷</span>
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

                {/* Badges */}
                <div className="absolute top-3 right-3 flex space-x-2">
                    {isSold && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-lg">Sold</span>}
                    {!isSold && (
                        <span className="bg-black/50 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-white/10">
                            {listing.condition.replace('_', ' ')}
                        </span>
                    )}
                </div>

                {/* Quick View Button for Desktop */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex">
                    <span className="bg-white/10 backdrop-blur-md text-white font-medium px-4 py-2 rounded-full border border-white/20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        View Details
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col relative">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-primary-light uppercase tracking-wide">{listing.category}</span>
                    <span className="text-base font-bold text-white tracking-tight">₹{Math.floor(listing.price).toLocaleString('en-IN')}</span>
                </div>

                <h3 className="text-lg font-bold text-zinc-100 mb-1 leading-tight group-hover:text-primary transition-colors line-clamp-1">
                    {listing.title}
                </h3>
                <p className="text-xs text-zinc-500 font-medium mb-3">{listing.brand} • {listing.model}</p>

                <div className="flex items-center text-xs text-zinc-400 border-t border-white/5 pt-3 mt-auto">
                    <span className="mr-2">📍</span> {listing.location}
                </div>
            </div>
        </div>
    );
};

const CheckoutModal = ({ request, onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        shipping_name: '', shipping_email: '', shipping_phone: '',
        shipping_address: '', shipping_pincode: '', payment_method: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
            return;
        }
        // Final Submit
        setLoading(true);
        try {
            await api.post('/orders/', {
                request_id: request.id,
                ...formData
            });
            alert("Order Placed Successfully!");
            onComplete();
            onClose();
        } catch (err) {
            alert(err.response?.data?.detail || "Checkout Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-white/10 shadow-2xl animate-scale-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>

                <h2 className="text-2xl font-bold text-white mb-6">
                    {step === 1 ? 'Shipping Details' : 'Payment Method'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {step === 1 ? (
                        <>
                            <input type="text" required placeholder="Full Name" className="w-full rounded-xl px-4 py-3"
                                value={formData.shipping_name} onChange={e => setFormData({ ...formData, shipping_name: e.target.value })} />
                            <input type="email" required placeholder="Email" className="w-full rounded-xl px-4 py-3"
                                value={formData.shipping_email} onChange={e => setFormData({ ...formData, shipping_email: e.target.value })} />
                            <input type="tel" required placeholder="Phone" className="w-full rounded-xl px-4 py-3"
                                value={formData.shipping_phone} onChange={e => setFormData({ ...formData, shipping_phone: e.target.value })} />
                            <textarea required placeholder="Address" className="w-full rounded-xl px-4 py-3 h-24"
                                value={formData.shipping_address} onChange={e => setFormData({ ...formData, shipping_address: e.target.value })} />
                            <input type="text" required placeholder="Pincode" className="w-full rounded-xl px-4 py-3"
                                value={formData.shipping_pincode} onChange={e => setFormData({ ...formData, shipping_pincode: e.target.value })} />
                        </>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {['UPI', 'Card', 'NetBanking', 'Bitcoin', 'COD'].map(method => (
                                <label key={method} className={`p-4 rounded-xl border cursor-pointer transition-all ${formData.payment_method === method ? 'bg-primary/20 border-primary text-white' : 'bg-slate-800/50 border-white/10 text-slate-400 hover:bg-slate-800'}`}>
                                    <input type="radio" required name="payment" value={method} className="hidden"
                                        onChange={e => setFormData({ ...formData, payment_method: e.target.value })} checked={formData.payment_method === method} />
                                    <div className="font-bold">{method}</div>
                                </label>
                            ))}
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        {step === 2 && <button type="button" onClick={() => setStep(1)} className="flex-1 btn-secondary text-slate-300 py-3 rounded-xl font-bold">Back</button>}
                        <button type="submit" disabled={loading} className="flex-1 btn-primary text-white py-3 rounded-xl font-bold">
                            {loading ? 'Processing...' : (step === 1 ? 'Next Step' : 'Pay & Order')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="glass-panel w-full max-w-lg rounded-3xl p-8 border border-white/10 shadow-2xl animate-scale-up relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                <h2 className="text-2xl font-bold text-white mb-2">Order Details</h2>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 mb-6">
                    {order.payment_status?.toUpperCase() || 'PAID'}
                </span>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Shipping Information</h3>
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 space-y-1">
                            <p className="font-bold text-white">{order.shipping_name}</p>
                            <p className="text-slate-300 text-sm">{order.shipping_address}, {order.shipping_pincode}</p>
                            <p className="text-slate-400 text-xs mt-2">{order.shipping_email} • {order.shipping_phone}</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Payment Method</h3>
                        <div className="text-lg font-bold text-white">{order.payment_method}</div>
                    </div>
                </div>

                <button onClick={onClose} className="w-full mt-8 btn-secondary text-white py-3 rounded-xl font-bold">Close</button>
            </div>
        </div>
    );
};



// --- Pages ---

const HomePage = ({ setPage }) => {
    const [listings, setListings] = useState([]);
    // Removed filteredListings as we will use server-side filtering
    const [filters, setFilters] = useState({ category: '', condition: '', minPrice: '', maxPrice: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [selectedListing, setSelectedListing] = useState(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch on any filter change
    useEffect(() => {
        fetchListings();
    }, [filters, debouncedSearch, sortBy]);

    const fetchListings = async () => {
        try {
            const params = {};
            if (debouncedSearch) params.q = debouncedSearch;
            if (filters.category) params.category = filters.category;
            if (filters.condition) params.condition = filters.condition;
            if (filters.minPrice) params.min_price = filters.minPrice;
            if (filters.maxPrice) params.max_price = filters.maxPrice;
            params.sort = sortBy;

            const res = await api.get('/listings/', { params });
            setListings(res.data);
        } catch (err) {
            console.error("Failed to fetch listings", err);
        }
    };

    const handleBuyRequest = async (listingId) => {
        try {
            await api.post('/requests/', { listing_id: listingId });
            alert("Buy request sent successfully! Check your dashboard.");
            setSelectedListing(null);
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to send request. You might need to login.");
            if (err.response?.status === 401) setPage('login');
        }
    };

    // Shared Filter Content
    const FilterContent = () => (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white text-lg">Filters</h3>
                <button onClick={() => {
                    setFilters({ category: '', condition: '', minPrice: '', maxPrice: '' });
                    setSearchQuery('');
                }} className="text-xs text-primary-light font-bold hover:text-white transition-colors uppercase tracking-wide">Reset</button>
            </div>

            <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Price Range (₹)</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Min"
                        className="w-full rounded-xl px-3 py-2 text-sm bg-slate-800/50 border border-white/10 focus:ring-2 focus:ring-primary/50"
                        value={filters.minPrice}
                        onChange={e => setFilters({ ...filters, minPrice: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="Max"
                        className="w-full rounded-xl px-3 py-2 text-sm bg-slate-800/50 border border-white/10 focus:ring-2 focus:ring-primary/50"
                        value={filters.maxPrice}
                        onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
                    />
                </div>
            </div>

            <div className="mb-8">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Category</label>
                <input
                    type="text"
                    className="w-full rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/50"
                    placeholder="e.g. Phone"
                    value={filters.category}
                    onChange={e => setFilters({ ...filters, category: e.target.value })}
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Condition</label>
                <div className="space-y-2">
                    {['', 'broken', 'for_parts', 'used', 'new'].map(cond => (
                        <label key={cond} className={`flex items-center space-x-3 cursor-pointer p-3 rounded-xl transition-all ${filters.condition === cond ? 'bg-primary/20 border border-primary/30' : 'hover:bg-white/5 border border-transparent'}`}>
                            <input
                                type="radio"
                                name="condition"
                                value={cond}
                                checked={filters.condition === cond}
                                onChange={e => setFilters({ ...filters, condition: e.target.value })}
                                className="hidden"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${filters.condition === cond ? 'border-primary' : 'border-slate-500'}`}>
                                {filters.condition === cond && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                            </div>
                            <span className={`text-sm font-medium ${filters.condition === cond ? 'text-white' : 'text-slate-400'}`}>
                                {cond === '' ? 'All' : cond.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
            {/* Hero Section */}
            <div className="mb-8 md:mb-12 text-center animate-fade-in">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 md:mb-6 tracking-tight leading-tight">
                    Find Value in <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Broken Tech</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-8 md:mb-10 px-4">
                    The premium marketplace for buying and selling repairable electronics and parts.
                </p>

                {/* Search Bar */}
                <div className="max-w-3xl mx-auto relative group z-10 px-2">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity duration-500"></div>
                    <div className="relative flex items-center bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2">
                        <span className="pl-3 md:pl-4 text-xl md:text-2xl">🔍</span>
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-transparent border-none text-white text-base md:text-lg w-full px-3 md:px-4 py-3 placeholder-slate-500 focus:ring-0"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        <button
                            onClick={() => setShowMobileFilters(true)}
                            className="md:hidden p-2 text-slate-300 hover:text-white border-l border-white/10 ml-2"
                        >
                            <span className="text-xl">⚙️</span>
                        </button>
                        <div className="hidden md:flex border-l border-white/10 pl-2">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="bg-transparent border-none text-slate-300 text-sm focus:ring-0 cursor-pointer hover:text-white transition-colors py-3"
                            >
                                <option value="newest">Latest Arrivals</option>
                                <option value="price_low">Price: Low to High</option>
                                <option value="price_high">Price: High to Low</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Filter Drawer */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-[100] md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}></div>
                    <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-[320px] bg-slate-900 border-l border-white/10 p-6 overflow-y-auto animate-slide-left shadow-2xl">
                        <div className="flex justify-end mb-4">
                            <button onClick={() => setShowMobileFilters(false)} className="p-2 bg-white/5 rounded-full text-slate-400">✕</button>
                        </div>
                        <FilterContent />
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="w-full btn-primary text-white py-3 rounded-xl font-bold"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
                {/* Desktop Filter Sidebar */}
                <div className="hidden md:block w-64 flex-shrink-0 animate-slide-up">
                    <div className="glass-panel p-6 rounded-2xl sticky top-28">
                        <FilterContent />
                    </div>
                </div>

                {/* Listings Grid */}
                <div className="flex-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map(listing => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                onView={setSelectedListing}
                            />
                        ))}
                    </div>
                    {listings.length === 0 && (
                        <div className="glass-panel text-center py-24 rounded-3xl border border-dashed border-slate-700 mt-4">
                            <div className="bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-5xl">🔍</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">No items found</h3>
                            <p className="text-slate-400 font-medium">Try adjusting your filters or search query.</p>
                            <button onClick={() => { setFilters({ category: '', condition: '', minPrice: '', maxPrice: '' }); setSearchQuery('') }} className="mt-6 text-primary-light font-bold hover:text-white transition-colors">Clear All Filters</button>
                        </div>
                    )}
                </div>
            </div>

            {selectedListing && (
                <ProductDetailsModal
                    listing={selectedListing}
                    onClose={() => setSelectedListing(null)}
                    onRequest={handleBuyRequest}
                />
            )}
        </div>
    );
};

const LoginPage = ({ setPage }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            setPage('home');
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-4 relative overflow-hidden">
            <div className="glass-panel p-10 rounded-3xl w-full max-w-md animate-fade-in relative z-10 border border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                    <span className="text-4xl mb-4 block">👋</span>
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-slate-400">Sign in to continue trading.</p>
                </div>

                {error && <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm border border-red-500/20 text-center font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full rounded-xl px-4 py-3.5"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full rounded-xl px-4 py-3.5"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="w-full btn-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg">
                        Sign In
                    </button>
                </form>
                <div className="mt-8 text-center text-slate-500">
                    New here? <button onClick={() => setPage('register')} className="text-primary-light font-bold hover:text-white transition-colors">Create Account</button>
                </div>
            </div>
        </div>
    );
};

const RegisterPage = ({ setPage }) => {
    const { register } = useAuth();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'buyer', location: '', phone: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData);
            setPage('home');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed');
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center py-12 p-4">
            <div className="glass-panel p-10 rounded-3xl w-full max-w-md animate-fade-in border border-white/10 shadow-2xl">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
                    <p className="text-slate-400">Join the premium tech marketplace.</p>
                </div>

                {error && <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm border border-red-500/20 text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                            <input type="text" required className="w-full rounded-xl px-4 py-3" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                            <input type="email" required className="w-full rounded-xl px-4 py-3" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone (WhatsApp)</label>
                            <input type="tel" required placeholder="+91..." className="w-full rounded-xl px-4 py-3" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                            <input type="password" required className="w-full rounded-xl px-4 py-3" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                            <select className="w-full rounded-xl px-4 py-3" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                <option value="buyer">Buyer</option>
                                <option value="seller">Seller</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Location</label>
                            <input type="text" required className="w-full rounded-xl px-4 py-3" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                        </div>
                    </div>
                    <button type="submit" className="w-full btn-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg mt-4">
                        Get Started
                    </button>
                </form>
                <div className="mt-8 text-center text-slate-500">
                    Already member? <button onClick={() => setPage('login')} className="text-primary-light font-bold hover:text-white transition-colors">Log in</button>
                </div>
            </div>
        </div>
    );
};

const CreateListingPage = ({ setPage }) => {
    const [formData, setFormData] = useState({
        title: '', category: '', brand: '', model: '',
        condition: 'broken', price: '', location: '', description: '',
        working_parts: '', photos: []
    });
    const [loading, setLoading] = useState(false);

    // Calculate Market Price Live
    const sellerPrice = parseFloat(formData.price) || 0;
    const marketPrice = Math.round((sellerPrice * 1.10) + 20);
    const potentialProfit = marketPrice - sellerPrice;

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + formData.photos.length > 5) {
            alert("You can only upload up to 5 photos.");
            return;
        }

        const newPhotos = [];
        let processedCount = 0;

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPhotos.push(reader.result);
                processedCount++;
                if (processedCount === files.length) {
                    setFormData(prev => ({
                        ...prev,
                        photos: [...prev.photos, ...newPhotos]
                    }));
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index) => {
        setFormData(prev => ({
            ...prev,
            photos: prev.photos.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/listings/', {
                ...formData,
                price: parseFloat(formData.price) // Sends expected Seller Price
            });
            alert('Listing created! Admin will review shortly.');
            setPage('dashboard');
        } catch (err) {
            alert('Failed to create listing: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-12 px-4 animate-slide-up">
            <h1 className="text-3xl font-bold mb-8 text-white">Create New Listing</h1>
            <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-3xl border border-white/10 space-y-8">
                <div>
                    <label className="block text-sm font-bold text-slate-400 mb-4 uppercase tracking-wide">Device Photos (Max 5)</label>
                    <div className="flex flex-wrap gap-4 items-start">
                        {formData.photos.map((photo, idx) => (
                            <div key={idx} className="relative w-28 h-28 rounded-2xl overflow-hidden border border-white/20 group shadow-md">
                                <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(idx)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {formData.photos.length < 5 && (
                            <label className="w-28 h-28 flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-2xl cursor-pointer hover:border-primary hover:bg-slate-800/50 transition-all group">
                                <span className="text-3xl text-slate-500 group-hover:text-primary transition-colors">+</span>
                                <span className="text-xs text-slate-500 mt-2 font-medium">Add Photo</span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />
                            </label>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
                        <input type="text" required className="w-full rounded-xl px-4 py-3" placeholder="Smartphone"
                            value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Brand</label>
                        <input type="text" className="w-full rounded-xl px-4 py-3" placeholder="Apple"
                            value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Model</label>
                        <input type="text" className="w-full rounded-xl px-4 py-3" placeholder="iPhone 12"
                            value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Condition</label>
                        <select className="w-full rounded-xl px-4 py-3"
                            value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })}>
                            <option value="broken">Broken / Damaged</option>
                            <option value="for_parts">For Parts Only</option>
                            <option value="used">Used / Working</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Title</label>
                    <input type="text" required className="w-full rounded-xl px-4 py-3" placeholder="Broken Screen iPhone 12 Pro Max"
                        value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Working Parts (Optional)</label>
                    <textarea className="w-full rounded-xl px-4 py-3 h-20" placeholder="e.g. Motherboard, Battery, Rear Camera..."
                        value={formData.working_parts} onChange={e => setFormData({ ...formData, working_parts: e.target.value })} />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Detailed Description</label>
                    <textarea required className="w-full rounded-xl px-4 py-3 h-32" placeholder="Describe the damage and condition in detail..."
                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/50 p-6 rounded-2xl border border-white/10">
                    <div>
                        <label className="block text-xs font-bold text-emerald-400 uppercase mb-2">You Receive (₹)</label>
                        <input type="number" step="1" required className="w-full rounded-xl px-4 py-3 font-bold text-lg text-emerald-400 border-emerald-500/50 focus:border-emerald-400" placeholder="0"
                            value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                        <p className="text-xs text-slate-500 mt-2">Enter the amount you want to get appropriately.</p>
                    </div>
                    <div className="flex flex-col justify-center">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Listing Price on Market (₹)</label>
                        <div className="text-3xl font-bold text-white tracking-tight">
                            ₹{marketPrice.toLocaleString('en-IN')}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Includes platform fees & commission.</p>
                    </div>
                </div>

                <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setPage('home')} className="flex-1 btn-secondary text-slate-300 py-4 rounded-xl font-bold hover:text-white">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="flex-1 btn-primary text-white py-4 rounded-xl font-bold disabled:opacity-50">
                        {loading ? 'Posting...' : 'Post Listing'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const DashboardPage = () => {
    const { user } = useAuth();
    const [myListings, setMyListings] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [myOrders, setMyOrders] = useState([]);
    const [checkoutRequest, setCheckoutRequest] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        if (user) loadDashboardData();
    }, [user]);

    const loadDashboardData = async () => {
        try {
            const reqSent = await api.get('/requests/my-requests');
            setSentRequests(reqSent.data);
            const reqInc = await api.get('/requests/incoming');
            setIncomingRequests(reqInc.data);
            const listRes = await api.get('/listings/?limit=100');
            setMyListings(listRes.data.filter(l => l.seller_id === user.id));

            // Allow fetch orders if endpoint exists (ignoring error if not yet ready)
            try {
                const ordersRes = await api.get('/orders/my-orders');
                setMyOrders(ordersRes.data);
            } catch (e) { }

        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateStatus = async (reqId, status) => {
        try {
            if (status === 'accept') await api.put(`/requests/${reqId}/accept`);
            if (status === 'reject') await api.put(`/requests/${reqId}/reject`);
            loadDashboardData();
        } catch (err) {
            alert("Action failed");
        }
    };

    // Helper to find order for a request
    const getOrderForRequest = (reqId) => myOrders.find(o => o.request_id === reqId);

    return (
        <div className="max-w-7xl mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8 text-white">Dashboard</h1>

            {/* Buyer Section: My Requests */}
            <div className="mb-12">
                <h2 className="text-xl font-bold mb-4 text-emerald-400">My Purchase Requests</h2>
                <div className="space-y-4">
                    {sentRequests.map(req => {
                        const order = getOrderForRequest(req.id);
                        const isCompleted = req.status === 'completed' || order;

                        return (
                            <div key={req.id} className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-white/5">
                                <div>
                                    <div className="text-xs text-slate-400 mb-1">Request #{req.id}</div>
                                    <div className="font-bold text-lg text-white">Listing ID: {req.listing_id}</div>
                                    <div className="text-sm text-slate-500">Status: <span className={`uppercase font-bold ${req.status === 'accepted' ? 'text-emerald-400' : (req.status === 'rejected' ? 'text-red-400' : 'text-yellow-400')}`}>{isCompleted ? 'PURCHASED' : req.status}</span></div>
                                </div>

                                {req.status === 'accepted' && !isCompleted && (
                                    <button onClick={() => setCheckoutRequest(req)} className="btn-primary text-white px-6 py-2 rounded-xl font-bold shadow-lg animate-pulse">
                                        Proceed to Buy
                                    </button>
                                )}

                                {isCompleted && (
                                    <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl font-bold border border-emerald-500/20">
                                        Order Placed ✓
                                    </div>
                                )}
                            </div>
                        )
                    })}
                    {sentRequests.length === 0 && <div className="text-slate-500">No requests sent.</div>}
                </div>
            </div>

            {/* Seller Section: Incoming Requests */}
            {user.role !== 'buyer' && (
                <div className="mb-12">
                    <h2 className="text-xl font-bold mb-4 text-secondary">Incoming Requests</h2>
                    <div className="space-y-4">
                        {incomingRequests.map(req => {
                            const order = getOrderForRequest(req.id); // Seller needs to fetch orders too, assuming endpoint returns correct data

                            return (
                                <div key={req.id} className="glass-panel p-6 rounded-2xl border border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="font-bold text-lg text-white">Item ID: {req.listing_id}</div>
                                            <div className="text-sm text-slate-400">Buyer: {req.buyer_name} ({req.buyer_location})</div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${req.status === 'accepted' || req.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {req.status}
                                        </div>
                                    </div>

                                    {req.status === 'pending' ? (
                                        <div className="flex gap-3">
                                            <button onClick={() => handleUpdateStatus(req.id, 'accept')} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl font-bold hover:bg-emerald-600 transition-colors">Accept Deal</button>
                                            <button onClick={() => handleUpdateStatus(req.id, 'reject')} className="flex-1 bg-slate-700 text-white py-2 rounded-xl font-bold hover:bg-slate-600 transition-colors">Reject</button>
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-sm text-slate-500">
                                            {req.status === 'rejected' ? 'You rejected this request.' : 'You accepted this deal. Waiting for payment...'}
                                        </div>
                                    )}

                                    {/* Show Order Details if available */}
                                    {order && (
                                        <button onClick={() => setSelectedOrder(order)} className="mt-4 w-full border border-emerald-500/30 text-emerald-400 py-2 rounded-xl font-bold hover:bg-emerald-500/10 transition-colors">
                                            View Order Details
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                        {incomingRequests.length === 0 && <div className="text-slate-500">No incoming requests.</div>}
                    </div>
                </div>
            )}

            {/* Seller Section: My Listings */}
            {user.role !== 'buyer' && (
                <div>
                    <h2 className="text-xl font-bold mb-4 text-white">My Active Listings</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myListings.map(listing => (
                            <div key={listing.id} className="glass-panel p-4 rounded-2xl border border-white/5 opacity-80 hover:opacity-100">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-white truncate">{listing.title}</span>
                                    <span className="text-emerald-400 font-bold">You get: ₹{listing.seller_price}</span>
                                </div>
                                <div className="text-xs text-slate-500 mb-2">{listing.status.toUpperCase()}</div>
                            </div>
                        ))}
                        {myListings.length === 0 && <div className="text-slate-500">No active listings.</div>}
                    </div>
                </div>
            )}

            {checkoutRequest && (
                <CheckoutModal
                    request={checkoutRequest}
                    onClose={() => setCheckoutRequest(null)}
                    onComplete={loadDashboardData}
                />
            )}

            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
};

const AdminPage = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const [usersRes, listingsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/listings_full') // New endpoint with profit info
            ]);
            setUsers(usersRes.data);
            setListings(listingsRes.data);
        } catch (err) {
            console.error("Admin Access Error", err);
            alert("Failed to load admin data");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm("Are you sure? This will delete the user and ALL their listings!")) return;
        try {
            await api.delete(`/admin/users/${id}`);
            fetchAdminData();
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to delete user");
        }
    };

    const handleDeleteListing = async (id) => {
        if (!confirm("Are you sure you want to delete this listing?")) return;
        try {
            await api.delete(`/admin/listings/${id}`);
            fetchAdminData();
        } catch (err) {
            alert(err.response?.data?.detail || "Failed to delete listing");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white font-bold animate-pulse">Loading Admin Panel...</div>;

    const totalProfit = listings.reduce((sum, l) => sum + (l.profit || 0), 0);
    const potentialProfit = listings.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.profit || 0), 0);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-white">Admin Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-800 to-slate-900">
                    <h3 className="text-slate-400 text-sm font-bold uppercase mb-2">Total Users</h3>
                    <p className="text-3xl font-bold text-white">{users.length}</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-emerald-900/40 to-slate-900">
                    <h3 className="text-emerald-400 text-sm font-bold uppercase mb-2">Active Listings Value</h3>
                    <p className="text-3xl font-bold text-white">₹{potentialProfit.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-500 mt-1">Projected Platform Profit</p>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-primary/20 to-slate-900">
                    <h3 className="text-primary-light text-sm font-bold uppercase mb-2">Total Listings</h3>
                    <p className="text-3xl font-bold text-white">{listings.length}</p>
                </div>
            </div>

            {/* Users Management */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 mb-8">
                <h2 className="text-xl font-bold mb-4 text-white">Manage Users</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{u.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{u.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{u.phone || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {u.id !== user.id && (
                                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-300">Delete</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Listings Management */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Manage Listings & Commissions</h2>
                    <div className="flex space-x-2">
                        <button className="px-3 py-1.5 text-xs font-bold bg-primary/20 text-primary-light rounded-lg border border-primary/20">Active Listings</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                        <thead className="bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Seller Expects</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Listed Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">Profit</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {listings.filter(l => l.status === 'active').map(l => (
                                <tr key={l.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                        {l.title}
                                        <div className="text-xs text-slate-500">ID: {l.id} • {new Date(l.created_at).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">₹{l.seller_price}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-bold">₹{l.price}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-400 font-bold">
                                        +₹{(l.profit || 0).toFixed(0)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${l.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-400'}`}>
                                            {l.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleDeleteListing(l.id)} className="text-red-400 hover:text-red-300">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sold History Table */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 mt-8">
                <h2 className="text-xl font-bold mb-4 text-white flex items-center">
                    <span className="mr-2">🎉</span> Sold History (Completed Trades)
                </h2>
                <SoldItemsTable />
            </div>
        </div>
    );
};

const SoldItemsTable = () => {
    const [soldItems, setSoldItems] = useState([]);

    useEffect(() => {
        api.get('/admin/sold_items').then(res => setSoldItems(res.data)).catch(console.error);
    }, []);

    if (soldItems.length === 0) return <div className="text-slate-500 italic p-4">No completed trades yet.</div>;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-emerald-900/20">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-emerald-400 uppercase tracking-wider">Item</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Seller Details</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-300 uppercase tracking-wider">Buyer Details</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-emerald-400 uppercase tracking-wider">Platform Profit</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Sold On</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                    {soldItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-bold text-white">{item.title}</div>
                                <div className="text-xs text-slate-500">#{item.id} • {item.category}</div>
                                <div className="text-xs text-emerald-400 mt-1">Sold for: ₹{item.price}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white">{item.seller_name}</div>
                                <div className="text-xs text-slate-400">{item.seller_email}</div>
                                <div className="text-xs text-slate-400 font-mono">{item.seller_phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-white">{item.buyer_name}</div>
                                <div className="text-xs text-slate-400">{item.buyer_email}</div>
                                <div className="text-xs text-slate-400 font-mono">{item.buyer_phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-400">
                                +₹{(item.profit || 0).toFixed(0)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-500">
                                {new Date(item.sold_date).toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- App Container ---

const App = () => {
    const [page, setPage] = useState('home');

    return (
        <AuthProvider>
            <div className="min-h-screen text-slate-100 font-sans selection:bg-primary/30 selection:text-white pb-20 md:pb-0">
                <CustomCursor />
                <MobileTopBar setPage={setPage} />
                <Navbar setPage={setPage} />
                <main>
                    {page === 'home' && <HomePage setPage={setPage} />}
                    {page === 'login' && <LoginPage setPage={setPage} />}
                    {page === 'register' && <RegisterPage setPage={setPage} />}
                    {page === 'create-listing' && <CreateListingPage setPage={setPage} />}
                    {page === 'dashboard' && <DashboardPage />}
                    {page === 'admin' && <AdminPage />}
                </main>
                <MobileBottomNav setPage={setPage} page={page} />
            </div>
        </AuthProvider>
    );
};

// Render
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
