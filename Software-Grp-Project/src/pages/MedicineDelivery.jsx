import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './MedicineDelivery.module.css';
import { medicineDatabase } from '../utils/mockData';

const MedicineDelivery = () => {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.email || '');

  const categories = ['all', 'fever', 'headache', 'cough', 'cold', 'pain', 'stomach'];
  const allMedicines = Object.entries(medicineDatabase).flatMap(([category, medicines]) =>
    medicines.map(medicine => ({ ...medicine, category }))
  );

  const filteredMedicines = allMedicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || medicine.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (medicine) => {
    setCart(prev => {
      const existing = prev.find(item => item.name === medicine.name);
      if (existing) {
        return prev.map(item =>
          item.name === medicine.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...medicine, quantity: 1 }];
    });
  };

  const removeFromCart = (medicineName) => {
    setCart(prev => prev.filter(item => item.name !== medicineName));
  };

  const updateQuantity = (medicineName, quantity) => {
    if (quantity <= 0) {
      removeFromCart(medicineName);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.name === medicineName
          ? { ...item, quantity }
          : item
      )
    );
  };

  const getMedicinePrice = (medicine) => {
    // Default prices based on medicine type
    const priceMap = {
      'Paracetamol': 5,
      'Ibuprofen': 8,
      'Aspirin': 6,
      'Dextromethorphan': 12,
      'Guaifenesin': 10,
      'Paracetamol + Pseudoephedrine': 15,
      'Vitamin C': 7,
      'Naproxen': 9,
      'Omeprazole': 14,
      'Antacid': 6,
    };
    return priceMap[medicine.name] || 10;
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + getMedicinePrice(item) * item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }
    if (!deliveryAddress) {
      alert('Please enter delivery address');
      return;
    }
    alert(`Order placed successfully! Total: $${getTotalPrice().toFixed(2)}. Your medicines will be delivered soon.`);
    setCart([]);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Online Medicine Delivery</h1>
        <p className={styles.subtitle}>Order prescription and over-the-counter medicines with home delivery</p>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.productsSection}>
          <div className={styles.searchFilters}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className={styles.categoryFilters}>
              {categories.map(category => (
                <button
                  key={category}
                  className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.medicinesGrid}>
            {filteredMedicines.map((medicine, index) => (
              <div key={index} className={styles.medicineCard}>
                <div className={styles.medicineHeader}>
                  <h3>{medicine.name}</h3>
                  <span className={styles.price}>${getMedicinePrice(medicine)}</span>
                </div>
                <div className={styles.medicineDetails}>
                  <p><strong>Dosage:</strong> {medicine.dosage}</p>
                  <p><strong>Category:</strong> {medicine.category}</p>
                  <p className={styles.precautions}>{medicine.precautions}</p>
                </div>
                <button
                  className={styles.addToCartButton}
                  onClick={() => addToCart(medicine)}
                >
                  Add to Cart
                </button>
              </div>
            ))}
            {filteredMedicines.length === 0 && (
              <div className={styles.noResults}>No medicines found matching your search</div>
            )}
          </div>
        </div>

        <div className={styles.cartSection}>
          <div className={styles.cart}>
            <h2 className={styles.cartTitle}>Shopping Cart</h2>
            {cart.length === 0 ? (
              <div className={styles.emptyCart}>Your cart is empty</div>
            ) : (
              <>
                <div className={styles.cartItems}>
                  {cart.map((item, index) => (
                    <div key={index} className={styles.cartItem}>
                      <div className={styles.itemInfo}>
                        <h4>{item.name}</h4>
                        <p className={styles.itemDosage}>{item.dosage}</p>
                        <p className={styles.itemPrice}>${getMedicinePrice(item) * item.quantity}</p>
                      </div>
                      <div className={styles.itemControls}>
                        <button
                          className={styles.quantityButton}
                          onClick={() => updateQuantity(item.name, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className={styles.quantity}>{item.quantity}</span>
                        <button
                          className={styles.quantityButton}
                          onClick={() => updateQuantity(item.name, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          className={styles.removeButton}
                          onClick={() => removeFromCart(item.name)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.cartSummary}>
                  <div className={styles.deliveryInfo}>
                    <label>Delivery Address</label>
                    <input
                      type="text"
                      className={styles.addressInput}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter delivery address"
                    />
                  </div>
                  <div className={styles.total}>
                    <strong>Total: ${getTotalPrice().toFixed(2)}</strong>
                  </div>
                  <button className={styles.checkoutButton} onClick={handleCheckout}>
                    Checkout →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineDelivery;
