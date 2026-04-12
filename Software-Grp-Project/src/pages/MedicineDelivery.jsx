import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './MedicineDelivery.module.css';

const MedicineDelivery = () => {
  const { user, authFetch } = useAuth();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [paymentMethod, setPaymentMethod] = useState('card'); // card, cod, upi
  const [upiId, setUpiId] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['all']);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/orders/medicines`);
        const data = await res.json();
        if (data.success) {
          setMedicines(data.medicines);
          const uniqueCategories = ['all', ...new Set(data.medicines.map(m => m.category))];
          setCategories(uniqueCategories);
        }
      } catch (err) {
        console.error('Failed to fetch medicines:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMedicines();

    // Check for payment status in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('orderStatus') === 'success') {
       const sessionId = urlParams.get('session_id');
       verifyPayment(sessionId);
    }
  }, []);

  const verifyPayment = async (sessionId) => {
    try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await authFetch(`${backendUrl}/api/orders/verify-payment`, {
            method: 'POST',
            body: JSON.stringify({ sessionId })
        });
        const data = await res.json();
        if (data.success) {
            alert('Payment successful! Your order is being processed.');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } catch (err) {
        console.error('Payment verification failed:', err);
    }
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || medicine.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (medicine) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === medicine._id);
      if (existing) {
        return prev.map(item =>
          item._id === medicine._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...medicine, quantity: 1 }];
    });
  };

  const removeFromCart = (medicineId) => {
    setCart(prev => prev.filter(item => item._id !== medicineId));
  };

  const updateQuantity = (medicineId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item._id === medicineId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }
    if (!deliveryAddress) {
      alert('Please enter delivery address');
      return;
    }
    if (paymentMethod === 'upi' && (!upiId || upiId.length < 8)) {
      alert('Please enter a valid UPI Transaction ID (at least 8 digits)');
      return;
    }

    try {
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await authFetch(`${backendUrl}/api/orders/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cartItems: cart,
                shippingAddress: deliveryAddress,
                paymentMethod: paymentMethod,
                upiId: paymentMethod === 'upi' ? upiId : undefined
            })
        });

        const data = await res.json();
        if (data.success && data.url) {
            window.location.href = data.url; // Redirect to Stripe
        } else if (data.success && data.isBypass) {
            alert(data.message || 'Order placed successfully!');
            setCart([]);
            window.location.href = '/Software-Grp-Project/appointments'; // Or wherever they view order status
        } else {
            alert(data.message || 'Checkout failed');
        }
    } catch (err) {
        console.error('Checkout error:', err);
        alert('An error occurred during checkout. Please try again.');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading medicines...</div>;
  }

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
            {filteredMedicines.map((medicine) => (
              <div key={medicine._id} className={styles.medicineCard}>
                <div className={styles.medicineHeader}>
                  <h3>{medicine.name}</h3>
                  <span className={styles.price}>Rs.{medicine.price}</span>
                </div>
                <div className={styles.medicineDetails}>
                  <p><strong>Dosage:</strong> {medicine.dosage}</p>
                  <p><strong>Category:</strong> {medicine.category}</p>
                  {medicine.requiresPrescription && (
                    <p className={styles.prescriptionBadge}>Rx Prescription Required</p>
                  )}
                  <p><strong>Stock:</strong> <span style={{ color: medicine.stock < 10 ? '#dc2626' : 'inherit', fontWeight: medicine.stock < 10 ? 600 : 400 }}>{medicine.stock > 0 ? `${medicine.stock} units left` : 'Out of Stock'}</span></p>
                  <p className={styles.precautions}>{medicine.precautions}</p>
                </div>
                <button
                  className={styles.addToCartButton}
                  onClick={() => addToCart(medicine)}
                  disabled={medicine.stock === 0}
                  style={{ 
                    backgroundColor: medicine.stock === 0 ? '#cbd5e0' : '', 
                    cursor: medicine.stock === 0 ? 'not-allowed' : 'pointer' 
                  }}
                >
                  {medicine.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
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
                  {cart.map((item) => (
                    <div key={item._id} className={styles.cartItem}>
                      <div className={styles.itemInfo}>
                        <h4>{item.name}</h4>
                        <p className={styles.itemDosage}>{item.dosage}</p>
                        <p className={styles.itemPrice}>Rs.{item.price * item.quantity}</p>
                      </div>
                      <div className={styles.itemControls}>
                        <button
                          className={styles.quantityButton}
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                        >
                          -
                        </button>
                        <span className={styles.quantity}>{item.quantity}</span>
                        <button
                          className={styles.quantityButton}
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          className={styles.removeButton}
                          onClick={() => removeFromCart(item._id)}
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
                  
                  {/* --- NEW PAYMENT MULTI-GATEWAY UI --- */}
                  <div className={styles.deliveryInfo} style={{ marginTop: '1rem' }}>
                    <label>Payment Method</label>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          value="card" 
                          checked={paymentMethod === 'card'} 
                          onChange={(e) => setPaymentMethod(e.target.value)} 
                        />
                        Credit Card (Stripe)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          value="cod" 
                          checked={paymentMethod === 'cod'} 
                          onChange={(e) => setPaymentMethod(e.target.value)} 
                        />
                        Cash on Delivery (COD)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          value="upi" 
                          checked={paymentMethod === 'upi'} 
                          onChange={(e) => setPaymentMethod(e.target.value)} 
                        />
                        UPI (GPay / PhonePe)
                      </label>
                    </div>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center', backgroundColor: '#faf2f5' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#B31B1B' }}>Scan to Pay Rs.{getTotalPrice().toFixed(2)}</p>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=pharmacy@dummyid&pn=OnlinePharmacy&am=${getTotalPrice().toFixed(2)}`} 
                          alt="UPI QR Code" 
                          style={{ width: '150px', height: '150px', margin: '0 auto', display: 'block', border: '5px solid white', borderRadius: '8px' }} 
                        />
                        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.9rem', color: '#555' }}>Enter 12-digit UPI Transaction ID</label>
                            <input 
                                type="text" 
                                placeholder="e.g. 301294819234" 
                                value={upiId}
                                autoFocus
                                onChange={(e) => setUpiId(e.target.value)}
                                style={{ padding: '0.6rem', width: '250px', textAlign: 'center', border: '2px solid #ddd', borderRadius: '6px', fontSize: '1.1rem', letterSpacing: '1px' }}
                            />
                        </div>
                    </div>
                  )}
                  {/* ---------------------------------- */}

                  <div className={styles.total}>
                    <strong>Total: Rs.{getTotalPrice().toFixed(2)}</strong>
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
