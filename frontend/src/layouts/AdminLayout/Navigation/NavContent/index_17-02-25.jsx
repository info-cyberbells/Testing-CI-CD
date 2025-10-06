import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { ListGroup } from 'react-bootstrap';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { FaMoon, FaSun } from 'react-icons/fa';

import NavGroup from './NavGroup';
import NavCard from './NavCard';

const NavContent = ({ navigation }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Optionally save to localStorage
    localStorage.setItem('darkMode', !isDarkMode);
  };

  const navItems = navigation.map((item) => {
    switch (item.type) {
      case 'group':
        return <NavGroup key={'nav-group-' + item.id} group={{
          ...item,
          style: {
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
            transition: 'all 0.3s ease'
          }
        }} />;
      default:
        return false;
    }
  });

  const DarkModeToggle = () => (
    <div className="dark-mode-toggle px-3 py-2">
      <button
        onClick={toggleDarkMode}
        className="btn d-flex align-items-center gap-2"
        style={{
          padding: '8px 16px',
          borderRadius: '20px',
          cursor: 'pointer',
          backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#000000',
          border: `1px solid ${isDarkMode ? '#333' : '#dee2e6'}`,
          transition: 'all 0.3s ease',
          width: '100%',
          justifyContent: 'center'
        }}
      >
        {isDarkMode ? (
          <>
            <FaSun size={16} color="#FFD700" />
            <span>Light Mode</span>
          </>
        ) : (
          <>
            <FaMoon size={16} color="#6c757d" />
            <span>Dark Mode</span>
          </>
        )}
      </button>
    </div>
  );

  let mainContent = (
    <div 
      className="navbar-content datta-scroll"
      style={{
        backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
        color: isDarkMode ? '#ffffff' : '#000000',
        transition: 'all 0.3s ease'
      }}
    >
      <PerfectScrollbar>
        <DarkModeToggle />
        <ListGroup 
          variant="flush" 
          as="ul" 
          bsPrefix=" " 
          className="nav pcoded-inner-navbar" 
          id="nav-ps-next"
          style={{
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000'
          }}
        >
          {navItems}
        </ListGroup>
        <NavCard />
      </PerfectScrollbar>
    </div>
  );

  return (
    <React.Fragment>
      {mainContent}
      <style>
        {`
          .pcoded-navbar {
            background: ${isDarkMode ? '#1a1a1a' : '#ffffff'};
            color: ${isDarkMode ? '#ffffff' : '#000000'};
          }
          
          .pcoded-navbar .pcoded-inner-navbar li > a {
            color: ${isDarkMode ? '#ffffff' : '#000000'};
          }
          
          .pcoded-navbar .pcoded-inner-navbar li.active > a,
          .pcoded-navbar .pcoded-inner-navbar li:focus > a,
          .pcoded-navbar .pcoded-inner-navbar li:hover > a {
            color: ${isDarkMode ? '#ffffff' : '#000000'};
            background: ${isDarkMode ? '#2d2d2d' : '#f8f9fa'};
          }

          .dark-mode-toggle {
            border-bottom: 1px solid ${isDarkMode ? '#333' : '#dee2e6'};
          }
        `}
      </style>
    </React.Fragment>
  );
};

NavContent.propTypes = {
  navigation: PropTypes.array
};

export default NavContent;