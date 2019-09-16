import React from 'react';
// import { Link } from 'react-router-dom';
import { Flex, Heading, Button } from '@chakra-ui/core';

const Navigation = ({ isSignedIn }) => {
  return (
    <Flex justifyContent="space-between" alignItems="center" p={4}>
      <Heading as="h1" size="lg" m={0}>
        Ecopush
      </Heading>

      {isSignedIn && (
        <Button
          onClick={() => {
            // eslint-disable-next-line no-undef
            firebase.auth().signOut();
          }}
        >
          Sign-out
        </Button>
      )}
    </Flex>
  );
};

export default Navigation;
