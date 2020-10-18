import { ApolloProvider } from "@apollo/client";
import { ChakraProvider, extendTheme } from "@chakra-ui/core";
import { mode } from "@chakra-ui/theme-tools";
import { useApollo } from "lib/apollo";
import { Provider as NextAuthProvider } from "next-auth/client";
import GoogleFonts from "next-google-fonts";
import type { AppProps } from "next/app";
import Layout from "scenes/Layout";
import { theme } from "theme";

const extendedTheme = extendTheme({
  styles: {
    global: (props) => ({
      body: {
        fontFamily: "'Rubik', sans-serif",
        color: mode(theme.light.textColor, theme.dark.textColor)(props),
        bg: mode(theme.light.bgColor, theme.dark.bgColor)(props),
      },
    }),
  },
});

const MyApp = (props: AppProps) => {
  const apolloClient = useApollo(props.pageProps.initialApolloState);

  return (
    <>
      <GoogleFonts
        href={`https://fonts.googleapis.com/css2?family=Rubik&display=swap`}
      />
      <NextAuthProvider session={props.pageProps.session}>
        <ApolloProvider client={apolloClient}>
          <ChakraProvider theme={extendedTheme}>
            <Layout {...props} />
          </ChakraProvider>
        </ApolloProvider>
      </NextAuthProvider>
    </>
  );
};

export default MyApp;
