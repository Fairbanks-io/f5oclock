import {useContext} from 'react'
import {
  Box,
  Container,
  Stack,
  Text,
  IconButton,
  Link,
  Button,
  Icon
} from '@chakra-ui/react';
import { FaInstagram, FaTwitter, FaYoutube,FaGithub } from 'react-icons/fa';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import {  ThemeContext } from '../Contexts/ThemeContext'

export default function Footer() {
  const { theme, setTheme } = useContext(ThemeContext)
  return (

      <Container
        as={Stack}
        maxW='container.xl'
        py={4}
        direction={{ base: 'column', md: 'row' }}
        spacing={4}
        justify={{ base: 'center', md: 'space-between' }}
        align={{ base: 'center', md: 'center' }}>
        <Text>Maintained with <span onClick={(e)=>{theme == 'classic' ? setTheme('custom') : setTheme('classic')}}>&#10084;</span> by <Link href="https://github.com/bsord" isExternal>bsord</Link> and <Link href="https://github.com/jonfairbanks" isExternal>jonfairbanks</Link></Text>
        <Stack direction={'row'} spacing={6}>
          <Link href='https://github.com/Fairbanks-io/f5-client/issues/new' isExternal>
            Request a subreddit <Icon as={FaGithub} mx='2px' />
          </Link>
        </Stack>
      </Container>
  );
}