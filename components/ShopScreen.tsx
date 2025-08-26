import React, { useState } from 'react';
import type { Product } from '../types';

interface ShopScreenProps {
    onBack: () => void;
}

const shopProducts: Product[] = [
    { id: '1', name: 'Himalayan Dog Chew', image_url: 'https://i.ibb.co/6yYx3fC/dog-chew.jpg', category: 'Food', description: 'Long-lasting natural chew for dental health.', price: 450, stock: 100 },
    { id: '2', name: 'Premium Catnip Toy', image_url: 'https://i.ibb.co/3WfK925/cat-toy.jpg', category: 'Toys', description: 'Infused with high-quality North American catnip.', price: 300, stock: 150 },
    { id: '3', name: 'Anti-Tick & Flea Shampoo', image_url: 'https://i.ibb.co/gDFt0fK/pet-shampoo.jpg', category: 'Grooming', description: 'Neem and Tulsi infused shampoo for dogs and cats.', price: 550, stock: 80 },
    { id: '4', name: 'Royal Canin Dog Food', image_url: 'https://i.ibb.co/RSC2g0g/dog-food.jpg', category: 'Food', description: 'Breed-specific nutrition for adult dogs.', price: 2200, stock: 50 },
    { id: '5', name: 'Interactive Feather Wand', image_url: 'https://i.ibb.co/5cQ3N6x/feather-wand.jpg', category: 'Toys', description: 'Engage your cat\'s hunting instincts.', price: 350, stock: 200 },
    { id: '6', name: 'Pet Grooming Gloves', image_url: 'https://i.ibb.co/yQj7X7D/grooming-glove.jpg', category: 'Grooming', description: 'Gently removes loose hair while petting.', price: 400, stock: 120 },
    { id: '7', name: 'Comfortable Pet Bed', image_url: 'https://i.ibb.co/z5pBvYg/pet-bed.jpg', category: 'Accessories', description: 'Ultra-soft bed for a cozy sleep.', price: 1500, stock: 60 },
    { id: '8', name: 'Adjustable Dog Leash', image_url: 'https://i.ibb.co/z4V4bH0/dog-leash.jpg', category: 'Accessories', description: 'Durable and reflective for safe walks.', price: 600, stock: 90 },
    { id: '9', name: 'Grain-Free Cat Food', image_url: 'https://i.ibb.co/D8d3wT1/cat-food.jpg', category: 'Food', description: 'High-protein, grain-free dry food for adult cats.', price: 1800, stock: 70 },
    { id: '10', name: 'Durable Chew Toy', image_url: 'https://i.ibb.co/QcYH2S3/chew-toy-dog.jpg', category: 'Toys', description: 'Designed for aggressive chewers, promotes dental health.', price: 750, stock: 110 },
];

type Category = 'All' | 'Food' | 'Toys' | 'Grooming' | 'Accessories';
const categories: Category[] = ['All', 'Food', 'Toys', 'Grooming', 'Accessories'];

const ShopScreen: React.FC<ShopScreenProps> = ({ onBack }) => {
    const [activeCategory, setActiveCategory] = useState<Category>('All');

    const filteredProducts = activeCategory === 'All'
        ? shopProducts
        : shopProducts.filter(p => p.category === activeCategory);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="p-4 flex items-center border-b bg-white sticky top-0 z-10">
                <button onClick={onBack} className="mr-4 text-gray-600 hover:text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold">Pet Essentials</h1>
            </header>
            
            <div className="p-4 sticky top-[65px] bg-gray-50 z-10">
                <div className="flex space-x-2 overflow-x-auto pb-2">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                activeCategory === category
                                    ? 'bg-teal-500 text-white shadow'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            <main className="flex-grow p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden group">
                            <div className="aspect-square w-full overflow-hidden">
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-gray-800 truncate">{product.name}</h3>
                                <p className="text-sm text-gray-500">{product.category}</p>
                                <p className="text-lg font-semibold text-teal-600 mt-1">₹{product.price.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default ShopScreen;
