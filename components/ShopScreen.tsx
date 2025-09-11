import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../types';
import { supabase } from '../services/supabaseClient';

interface ShopScreenProps {}

type Category = 'All' | 'Food' | 'Toys' | 'Grooming' | 'Accessories' | 'Medicine';
const categories: Category[] = ['All', 'Food', 'Toys', 'Grooming', 'Accessories', 'Medicine'];

// --- Sub-components ---

const ProductCard: React.FC<{ product: Product; onAddToCart: () => void; }> = ({ product, onAddToCart }) => {
    const isOutOfStock = product.stock === 0;
    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden group flex flex-col">
            <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                        <span className="text-white font-bold bg-gray-800/80 px-3 py-1 rounded-full text-sm">Out of Stock</span>
                    </div>
                )}
                <img
                    src={product.image_url || 'https://i.ibb.co/2vX5vVd/default-pet-avatar.png'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </div>
            <div className="p-3 flex flex-col flex-grow">
                <h3 className="font-bold text-gray-800 truncate flex-grow">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.category}</p>
                 <div className="flex justify-between items-center mt-2">
                    <p className="text-lg font-semibold text-teal-600">₹{product.price.toLocaleString()}</p>
                    <button
                        onClick={onAddToCart}
                        disabled={isOutOfStock}
                        className="bg-teal-100 text-teal-700 font-bold text-xs px-3 py-1.5 rounded-full hover:bg-teal-200 disabled:opacity-50 disabled:cursor-not-allowed interactive-scale"
                        aria-label={`Add ${product.name} to cart`}
                    >
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
};

const CartModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    cart: Map<string, { product: Product; quantity: number }>;
    onUpdateQuantity: (productId: string, newQuantity: number) => void;
}> = ({ isOpen, onClose, cart, onUpdateQuantity }) => {
    const [isExiting, setIsExiting] = useState(false);
    
    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300);
    };

    const cartItems = useMemo(() => Array.from(cart.values()), [cart]);
    const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cartItems]);

    if (!isOpen) return null;

    return (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="cart-heading">
            <div
                className={`w-full bg-gray-50 rounded-t-2xl p-4 pt-2 max-h-[80vh] flex flex-col ${isExiting ? 'exiting' : ''} bottom-sheet-content`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto my-2 flex-shrink-0"></div>
                <h2 id="cart-heading" className="text-xl font-bold text-center mb-4 flex-shrink-0">My Cart</h2>
                
                {cartItems.length === 0 ? (
                    <div className="text-center text-gray-500 py-16">Your cart is empty.</div>
                ) : (
                    <div className="overflow-y-auto space-y-3 flex-grow">
                        {cartItems.map(({ product, quantity }) => (
                            <div key={product.id} className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                                <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-md object-cover"/>
                                <div className="ml-3 flex-grow">
                                    <p className="font-semibold text-sm">{product.name}</p>
                                    <p className="text-sm text-gray-500">₹{product.price.toLocaleString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => onUpdateQuantity(product.id, quantity - 1)} className="w-7 h-7 bg-gray-200 rounded-full font-bold">-</button>
                                    <span>{quantity}</span>
                                    <button onClick={() => onUpdateQuantity(product.id, quantity + 1)} className="w-7 h-7 bg-gray-200 rounded-full font-bold">+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <footer className="mt-4 border-t pt-4 flex-shrink-0">
                    <div className="flex justify-between font-bold text-lg">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toLocaleString()}</span>
                    </div>
                    <button
                        disabled={cartItems.length === 0}
                        onClick={() => alert('Checkout functionality is coming soon!')}
                        className="w-full mt-4 bg-teal-500 text-white font-bold py-3 rounded-lg disabled:opacity-50"
                    >
                        Proceed to Checkout
                    </button>
                </footer>
            </div>
        </div>
    );
};

const ShopScreen: React.FC<ShopScreenProps> = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<Category>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [maxPrice, setMaxPrice] = useState(10000);
    const [cart, setCart] = useState<Map<string, { product: Product; quantity: number }>>(new Map());
    const [showCart, setShowCart] = useState(false);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!supabase) {
                setError("Database connection not available.");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                // 1. Get IDs of approved vendors
                const { data: vendors, error: vendorsError } = await supabase
                    .from('professional_profiles')
                    .select('id')
                    .eq('profile_type', 'vendor')
                    .eq('status', 'approved');

                if (vendorsError) throw vendorsError;
                if (!vendors || vendors.length === 0) {
                    setProducts([]);
                    return;
                }
                const vendorIds = vendors.map(v => v.id);

                // 2. Get approved products from those vendors
                const { data: productsData, error: productsError } = await supabase
                    .from('vendor_products')
                    .select('*')
                    .in('vendor_id', vendorIds)
                    .eq('status', 'approved');

                if (productsError) throw productsError;
                setProducts(productsData || []);
            } catch (err: any) {
                setError("Could not load products. Please try again later.");
                console.error("Error fetching products:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const addToCart = (productToAdd: Product) => {
        setCart(prevCart => {
            const newCart = new Map(prevCart);
            const existingItem = newCart.get(productToAdd.id);
            if (existingItem) {
                if (existingItem.quantity < productToAdd.stock) {
                    newCart.set(productToAdd.id, { ...existingItem, quantity: existingItem.quantity + 1 });
                } else {
                    alert(`Cannot add more. Only ${productToAdd.stock} in stock.`);
                }
            } else if (productToAdd.stock > 0) {
                newCart.set(productToAdd.id, { product: productToAdd, quantity: 1 });
            }
            return newCart;
        });
    };
    
    const updateCartQuantity = (productId: string, newQuantity: number) => {
        setCart(prevCart => {
            const newCart = new Map(prevCart);
            const item = newCart.get(productId);
            if (!item) return newCart;

            if (newQuantity <= 0) {
                newCart.delete(productId);
            } else if (newQuantity > item.product.stock) {
                alert(`Cannot add more. Only ${item.product.stock} in stock.`);
                newCart.set(productId, { ...item, quantity: item.product.stock });
            } else {
                 newCart.set(productId, { ...item, quantity: newQuantity });
            }
            return newCart;
        });
    };

    const filteredProducts = useMemo(() => {
        return products
            .filter(p => activeCategory === 'All' || p.category === activeCategory)
            .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())))
            .filter(p => p.price <= maxPrice);
    }, [products, activeCategory, searchQuery, maxPrice]);

    const cartItemCount = useMemo(() => {
        return Array.from(cart.values()).reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);

    return (
        <>
            <div className="min-h-screen flex flex-col bg-gray-50">
                <header className="p-4 flex items-center border-b bg-white sticky top-0 z-20">
                    <button onClick={() => navigate(-1)} className="mr-4 text-gray-600 hover:text-gray-900">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-xl font-bold">Pet Essentials</h1>
                    <button onClick={() => setShowCart(true)} className="ml-auto relative p-2 text-gray-600 hover:text-teal-600" aria-label={`View cart, ${cartItemCount} items`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        {cartItemCount > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{cartItemCount}</span>}
                    </button>
                </header>

                <div className="p-4 sticky top-[65px] bg-gray-50 z-10 border-b">
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search for toys, food, etc."
                        className="w-full p-2 border rounded-md"
                    />
                    <div className="mt-4">
                        <label htmlFor="price-range" className="text-sm font-medium text-gray-700">Max Price: ₹{maxPrice.toLocaleString()}</label>
                        <input id="price-range" type="range" min="50" max="10000" step="50" value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} className="w-full mt-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500" />
                    </div>
                </div>
                
                <div className="p-4 pt-2 sticky top-[165px] bg-gray-50 z-10">
                    <div className="flex space-x-2 overflow-x-auto pb-2">
                        {categories.map(category => (
                            <button key={category} onClick={() => setActiveCategory(category)} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${activeCategory === category ? 'bg-teal-500 text-white shadow' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                <main className="flex-grow p-4">
                    {loading && <div className="text-center p-8"><div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-teal-500 mx-auto"></div><p className="mt-2 text-gray-600">Loading products...</p></div>}
                    {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">{error}</div>}
                    {!loading && !error && products.length === 0 && <div className="text-center text-gray-500 pt-16"><p className="font-semibold">Our shelves are looking a bit bare!</p><p>No approved products are available right now. Please check back later.</p></div>}
                    {!loading && !error && products.length > 0 && filteredProducts.length === 0 && <div className="text-center text-gray-500 pt-16"><p className="font-semibold">No products match</p><p>Try adjusting your search or filters.</p></div>}
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} />
                        ))}
                    </div>
                </main>
            </div>
            <CartModal isOpen={showCart} onClose={() => setShowCart(false)} cart={cart} onUpdateQuantity={updateCartQuantity} />
        </>
    );
};

export default ShopScreen;