import React, { useEffect, useState, useRef } from 'react';
import { fetchGetRequest } from '../../../../utils';
import {
  Heading,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
  Spinner
} from '@chakra-ui/core';

const Device = ({ userId, idToken }) => {
  const [devices, setDevices] = useState(undefined);
  // eslint-disable-next-line no-unused-vars
  const [deviceSockets, setDeviceSockets] = useState({});

  useEffect(() => {
    if (devices && devices.length > 0) {
      devices.forEach(device => {
        // if device socket does not exist
        if (!(device.key in deviceSockets)) {
          // let socket = new WebSocket(
          //   `ws://connect.websocket.in/ecopush?room_id=${device.key}`
          // );
          // socket.onopen = () => {
          //   socket.send(
          //     JSON.stringify({ status: `Device ${device.key} connected` })
          //   );
          // };
          // setDeviceSockets(sockets => {
          //   Object.assign(sockets, { [device.key]: socket });
          //   return sockets;
          // });
        }
      });
    }
  }, [deviceSockets, devices]);

  const fetchDevices = async (uid, token) => {
    if (uid && token) {
      let userDevices = await fetchGetRequest(
        `/api/device?userId=${uid}`,
        token
      );
      setDevices(userDevices);
    } else {
      console.log('fetchDevices error', uid, token);
    }
  };

  useEffect(() => {
    fetchDevices(userId, idToken);
  }, [idToken, userId]);

  // device id
  const registerDeviceIdInputRef = useRef(null);
  const [isInvalidDeviceId, setIsInvalidDeviceId] = useState(false);
  const [deviceIdInputErrorMessage, setDeviceIdInputErrorMessage] = useState(
    undefined
  );

  // device name
  const registerDeviceNameInputRef = useRef(null);
  const [isInvalidDeviceName, setIsInvalidDeviceName] = useState(false);
  const [
    deviceNameInputErrorMessage,
    setDeviceNameInputErrorMessage
  ] = useState(undefined);

  const [hasRegisterFailed, setHasRegisterFailed] = useState(false);

  /**
   * Register new device.
   * @param {*} uid
   * @param {*} token
   */
  const registerDevice = async (uid, token) => {
    setHasRegisterFailed(false);

    if (isInvalidDeviceName) {
      setIsInvalidDeviceName(false);
    }

    if (isInvalidDeviceId) {
      setIsInvalidDeviceId(false);
    }

    const deviceIdInput = registerDeviceIdInputRef.current;
    const deviceNameInput = registerDeviceNameInputRef.current;
    let errorFound = false;
    if (!deviceIdInput.checkValidity()) {
      setIsInvalidDeviceId(true);
      setDeviceIdInputErrorMessage(deviceIdInput.validationMessage);
      errorFound = true;
    }

    if (!deviceNameInput.checkValidity()) {
      setIsInvalidDeviceName(true);
      setDeviceNameInputErrorMessage(deviceNameInput.validationMessage);
      errorFound = true;
    }

    if (!errorFound) {
      const id = deviceIdInput.value;
      const name = deviceNameInput.value;
      if (uid && token && id) {
        await fetch(`/api/device`, {
          method: 'post',
          body: JSON.stringify({ deviceId: id, deviceName: name, userId: uid }),
          headers: new Headers({
            Authorization: 'Bearer ' + token
          })
        })
          .then(response => {
            if (response.status === 200) {
              deviceNameInput.value = '';
              deviceIdInput.value = '';
              fetchDevices(userId, idToken);
            } else {
              throw new Error('Not 200 response');
            }
          })
          .catch(error => {
            setHasRegisterFailed(true);
            console.log('registerDevice error', error);
          });
      } else {
        console.log('registerDevice error', uid, token, id);
      }
    }
  };

  // eslint-disable-next-line no-unused-vars
  // const startDevice = (deviceId, type) => {
  //   deviceSockets[deviceId].send(JSON.stringify({ command: 'start', type }));
  // };

  return (
    <>
      <Box m={4} p={4} borderWidth="1px" rounded="lg">
        <Heading my={2}>Register Monitoring Device</Heading>
        <Box m={1}>
          <form>
            <FormControl mb={2} isInvalid={isInvalidDeviceName} isRequired>
              <FormLabel htmlFor="device-name">Device Name</FormLabel>
              <Input
                id="device-name"
                type="text"
                ref={registerDeviceNameInputRef}
                placeholder="Enter new device name"
                size="sm"
                width="200px"
              />
              <FormErrorMessage>{deviceNameInputErrorMessage}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={isInvalidDeviceId} isRequired>
              <FormLabel htmlFor="device-id">Device ID</FormLabel>
              <Input
                id="device-id"
                type="number"
                ref={registerDeviceIdInputRef}
                placeholder="Enter new device ID"
                size="sm"
                width="200px"
              />
              <FormErrorMessage>{deviceIdInputErrorMessage}</FormErrorMessage>
            </FormControl>

            <FormControl isInvalid={hasRegisterFailed}>
              <Button mt={4} onClick={() => registerDevice(userId, idToken)}>
                Register
              </Button>
              <FormErrorMessage>
                Error registering device. Please try again later.
              </FormErrorMessage>
            </FormControl>
          </form>
        </Box>
      </Box>
      <Box m={4} p={4} borderWidth="1px" rounded="lg">
        <Heading my={2}>Monitoring Devices</Heading>
        {devices ? (
          <StatGroup>
            {devices.map((device, index) => {
              const deviceName = device.deviceName
                ? `${device.deviceName}`
                : '';
              const deviceInfo = `${device.key} `;
              const { appliances } = device;
              let numberOfAppliances =
                (appliances && Object.values(appliances).length) || 0;
              return (
                <Stat key={index} borderWidth="1px" p={2} m={1}>
                  <StatLabel>{deviceName}</StatLabel>
                  <StatNumber>{`${numberOfAppliances} Appliances`}</StatNumber>
                  <StatHelpText>{deviceInfo}</StatHelpText>
                </Stat>
              );
            })}
          </StatGroup>
        ) : (
          <Spinner size="xl" borderStyle="solid" />
        )}
      </Box>
    </>
  );
};

export default Device;
