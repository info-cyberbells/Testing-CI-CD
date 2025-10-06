import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Dropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { translateText } from '../../../../utils/translate';

import ChatList from './ChatList';
import './style.css'

const NavRight = ({ userImage }) => {
  const [listOpen, setListOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('userEmail');
    if (storedUser) {
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    const translateNames = async () => {
      const firstName = localStorage.getItem('firstName') || '';
      const lastName = localStorage.getItem('lastName') || '';
      const name = `${firstName}${lastName ? ` ${lastName}` : ''}`.trim();
      setDisplayName(name);
    };
    translateNames();
  }, []);

  const handleLogout = () => {
    const language = localStorage.getItem('language');

    localStorage.clear();

    if (language) {
      localStorage.setItem('language', language);
    }

    setIsLoggedIn(false);
    navigate('/login');
  };

  return (
    <React.Fragment>
      <ListGroup as="ul" bsPrefix=" " className="navbar-nav ml-auto" id="navbar-right">
        <ListGroup.Item as="li" bsPrefix=" ">
          <div className="pro-head text-dark">
            {displayName}
            <Link to="/" className="dud-logout black fs-5" title="Logout" onClick={handleLogout}>
              <i className="feather icon-log-out logout-icon" />
            </Link>
          </div>
        </ListGroup.Item>
      </ListGroup>
      <ChatList listOpen={listOpen} closed={() => setListOpen(false)} />
    </React.Fragment>
  );
};

export default NavRight;