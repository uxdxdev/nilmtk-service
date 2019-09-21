import React, { useRef, useState } from 'react';
import {
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Text,
  Box
} from '@chakra-ui/core';

const Appliance = ({ idToken, device, appliance }) => {
  const applianceNameInputRef = useRef(null);
  const [isInvalidApplianceName, setIsInvalidApplianceName] = useState(false);
  const [
    applianceNameInputErrorMessage,
    setApplianceNameInputErrorMessage
  ] = useState(undefined);
  const [applianceName, setApplianceName] = useState(appliance.name);

  const updateApplianceInfo = async (token, deviceId, applianceId, name) => {
    await fetch(`/api/device`, {
      method: 'put',
      body: JSON.stringify({ origin: 'app', deviceId, applianceId, name }),
      headers: new Headers({
        Authorization: 'Bearer ' + token
      })
    })
      .then(response => {
        if (response.status === 200) {
          console.log('appliance information updated');
          setIsInvalidApplianceName(false);
          setApplianceNameInputErrorMessage(undefined);
          applianceNameInputRef.current.value = '';
          setApplianceName(name);
        } else {
          throw new Error('Not 200 response');
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  const isValidApplianceInfo = applianceNameInputRef => {
    if (!applianceNameInputRef.current.checkValidity()) {
      setIsInvalidApplianceName(true);
      setApplianceNameInputErrorMessage(
        applianceNameInputRef.current.validationMessage
      );
    } else {
      return applianceNameInputRef.current.checkValidity();
    }
  };

  return (
    <Box p={5} shadow="md" borderWidth="1px">
      <Text mb={2}>{applianceName}</Text>
      <Text mb={2}>{`(${device.deviceName})`}</Text>
      <FormControl mb={2} isInvalid={isInvalidApplianceName} isRequired>
        <FormLabel htmlFor="appliance-name">Appliance Name</FormLabel>
        <Input
          id="appliance-name"
          type="text"
          ref={applianceNameInputRef}
          placeholder={applianceName}
          size="sm"
          width="150px"
          maxLength={15}
        />
        <Button
          mt={2}
          onClick={() => {
            if (isValidApplianceInfo(applianceNameInputRef)) {
              updateApplianceInfo(
                idToken,
                device.key,
                appliance.id,
                applianceNameInputRef.current.value
              );
            }
          }}
        >
          Update
        </Button>
        <FormErrorMessage>{applianceNameInputErrorMessage}</FormErrorMessage>
      </FormControl>
    </Box>
  );
};

export default Appliance;
