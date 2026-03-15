import React from 'react';
import Hero from '../components/Hero/Hero';
import Statistics from '../components/Statistics/Statistics';
import ComprehensiveCare from '../components/ComprehensiveCare/ComprehensiveCare';
import TopSpecialists from '../components/TopSpecialists/TopSpecialists';
import BookAppointment from '../components/BookAppointment/BookAppointment';
import Footer from '../components/Footer/Footer';

const Home = () => {
  return (
    <>
      <Hero />
      <Statistics />
      <ComprehensiveCare />
      <TopSpecialists />
      <BookAppointment />
      <Footer />
    </>
  );
};

export default Home;
