import React, { useEffect, useState, useRef } from 'react';
import { fetchGetRequest } from '../../../../utils';
import {
  Heading,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Text,
  Box,
  Stack
} from '@chakra-ui/core';
import Appliance from './components/Appliance';

const Devices = ({ userId, idToken }) => {
  const [devices, setDevices] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [deviceSockets, setDeviceSockets] = useState({});

  useEffect(() => {
    if (devices.length > 0) {
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
            console.log(error);
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

  const DeviceInfo = ({ device }) => {
    const deviceName = device.deviceName ? `(${device.deviceName})` : '';
    const text = `${deviceName} ID: ${device.key} `;
    return (
      <Box p={5} shadow="md" borderWidth="1px">
        <Text>{text}</Text>
      </Box>
    );
  };

  return (
    <>
      <Heading my={1}>Register Monitoring Device</Heading>
      <form>
        <FormControl mb={2} isInvalid={isInvalidDeviceName} isRequired>
          <FormLabel htmlFor="device-name">Device Name</FormLabel>
          <Input
            id="device-name"
            type="text"
            ref={registerDeviceNameInputRef}
            placeholder="Enter new device name"
            size="sm"
            width="150px"
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
            width="150px"
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
      <Heading my={1}>Devices</Heading>
      <Stack isInline>
        {devices &&
          devices.map((device, index) => {
            return <DeviceInfo key={index} device={device} />;
          })}
      </Stack>
      <Heading my={1}>Appliances</Heading>
      <Stack isInline>
        {devices &&
          devices.map(device => {
            const { appliances } = device;
            if (appliances) {
              return Object.values(appliances).map((appliance, index) => {
                return (
                  <Appliance
                    idToken={idToken}
                    key={index}
                    device={device}
                    appliance={appliance}
                  />
                );
              });
            } else {
              return [];
            }
          })}
      </Stack>
    </>
  );
};

export default Devices;
