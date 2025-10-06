// src/contexts/UserContext.js

import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true); // To handle loading state
  const [error, setError] = useState(null); // To handle errors

  // Fetch users from the fake API
  useEffect(() => {
    axios
      .get("https://jsonplaceholder.typicode.com/users")
      .then((response) => {
        setUsers(response.data);
        setLoading(false);
        console.log("Users fetched:", response.data);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
        console.error("Error fetching users:", err);
      });
  }, []);

  // Create a new user
  const createUser = (userData) => {
    axios
      .post("https://jsonplaceholder.typicode.com/users", userData)
      .then((response) => {
        // Since jsonplaceholder doesn't actually add the user, we'll simulate it
        const newUser = { id: users.length + 1, ...response.data };
        setUsers([...users, newUser]);
        console.log("User created:", newUser);
      })
      .catch((err) => {
        console.error("Error creating user:", err);
      });
  };

  // Update an existing user
  const updateUser = (id, updatedData) => {
    axios
      .put(`https://jsonplaceholder.typicode.com/users/${id}`, updatedData)
      .then((response) => {
        // Simulate updating the user
        const updatedUser = { id, ...response.data };
        setUsers(users.map((user) => (user.id === id ? updatedUser : user)));
        console.log("User updated:", updatedUser);
      })
      .catch((err) => {
        console.error("Error updating user:", err);
      });
  };

  // Delete a user
  const deleteUser = (id) => {
    axios
      .delete(`https://jsonplaceholder.typicode.com/users/${id}`)
      .then(() => {
        // Simulate deleting the user
        setUsers(users.filter((user) => user.id !== id));
        console.log(`User with id ${id} deleted.`);
      })
      .catch((err) => {
        console.error("Error deleting user:", err);
      });
  };

  return (
    <UserContext.Provider
      value={{ users, loading, error, createUser, updateUser, deleteUser }}
    >
      {children}
    </UserContext.Provider>
  );
}
