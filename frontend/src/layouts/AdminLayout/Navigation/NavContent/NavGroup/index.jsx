import PropTypes from 'prop-types';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ListGroup } from 'react-bootstrap';
import NavCollapse from '../NavCollapse';
import NavItem from '../NavItem';

const NavGroup = ({ layout, group }) => {
  const { t } = useTranslation();

  let navItems = '';

  if (group.children) {
    const groups = group.children;
    navItems = Object.keys(groups).map((key) => {
      const item = { ...groups[key], title: t(groups[key].title) }; 
      switch (item.type) {
        case 'collapse':
          return <NavCollapse key={item.id} collapse={item} type="main" />;
        case 'item':
          return <NavItem layout={layout} key={item.id} item={item} />;
        default:
          return false;
      }
    });
  }

  return (
    <React.Fragment>
      {/* <ListGroup.Item as="li" bsPrefix=" " key={group.id} className="nav-item pcoded-menu-caption" style={{marginBottom: '-25px'}}>
        <label>{group.title}</label>
      </ListGroup.Item> */}
      {navItems}
    </React.Fragment>
  );
};

NavGroup.propTypes = {
  layout: PropTypes.string,
  group: PropTypes.object,
  id: PropTypes.number,
  children: PropTypes.node,
  title: PropTypes.string
};

export default NavGroup;