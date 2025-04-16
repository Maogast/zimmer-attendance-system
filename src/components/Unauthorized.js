// src/components/Unauthorized.js
import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    // Navigate to the home page. Adjust the route as needed.
    navigate("/");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        textAlign: "center",
        p: 3
      }}
    >
      <Typography variant="h3" component="h1" gutterBottom>
        Unauthorized
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        You do not have permission to view this page.
      </Typography>
      <Button variant="contained" color="primary" onClick={handleGoBack}>
        Go to Home
      </Button>
    </Box>
  );
}