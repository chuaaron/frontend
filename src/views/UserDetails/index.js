// @flow
import React, { useState, useContext } from "react";
import SettingsIcon from "@material-ui/icons/Settings";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import Snackbar from "@material-ui/core/Snackbar";
import Typography from "@material-ui/core/Typography";
import KeyboardBackspace from "@material-ui/icons/KeyboardBackspace";
import { useIdle, useAudio } from "react-use";
// $FlowFixMe
import kaChing from "data/ka-ching.mp3";
import API from "API";
import AsidePanel from "./AsidePanel";
import ChangeCreditPanel from "./ChangeCreditPanel";
import * as Cur from "components/Currency";
import BarcodeScanner from "components/BarcodeScanner";
import TopBar from "components/TopBar";
import Main from "components/Main";
import ProductsContext from "contexts/Products";
import useErrorHandler from "contexts/Error";
import makeStyles from "@material-ui/styles/makeStyles";

type Props = {
  user: User,
  backToList: () => void,
  openSettings: (user: User) => void
};

const ChangeCreditPanels = React.memo((props) => {
  const { addCredit, backToList, onBarcodeNotFound } = props;
  const products = useContext(ProductsContext);
  const categories = [...new Set(products.map((obj) => obj.category))];
  const scannerSuccess = (msg: string) => {
    const product = products.find((prod) => prod.ean.split("|").includes(msg));
    if (product != null) {
      addCredit(product)();
    } else if (msg === "back") {
      backToList();
    } else {
      onBarcodeNotFound();
    }
  };
  const filterProducts = (cat) => products.filter((p) => p.category === cat);
  return (
    <Grid item xs={12} md={9}>
      <BarcodeScanner onSuccess={scannerSuccess} />
      <ChangeCreditPanel products={[0.5, 1, 2, 5, 10, -0.5, -1, -1.5, -2, -5]}
        category="Change Credit" addCredit={addCredit} condensed />
      { categories.map((cat) => (
        <ChangeCreditPanel // $FlowFixMe
          products={filterProducts(cat)}
          category={cat} key={cat} addCredit={addCredit} />
      ))}
    </Grid>
  );
});

const useStyles = makeStyles((theme) => ({
  aside: {
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down("sm")]: {
      paddingRight: 0
    },
    [theme.breakpoints.up("md")]: {
      paddingRight: theme.spacing(2)
    }
  }
}));

const UserDetails = (props: Props) => {
  const classes = useStyles();
  const isIdle = useIdle(30e3);
  if (isIdle) {
    props.backToList();
  }
  const openSettings = () => props.openSettings(props.user);
  const [user, setUser] = useState(props.user);
  const [snackbarMsg, setSnackbarMsg] = useState(null);
  const closeSnackbar = () => setSnackbarMsg(null);
  const handleError = useErrorHandler();
  const [audio, _audioState, audioControls] = useAudio({ src: kaChing });
  const kaching = () => {
    // reset back to 0 for when two transactions are too close after each other
    audioControls.seek(0);
    audioControls.play();
  };
  const handleBarcodeNotFound = () => {
    setSnackbarMsg(
      <Typography color="error">
        Unknown barcode scanned. Please enter the transaction manually.
      </Typography>
    );
  };
  const addCredit = (ap: Product | number) => () => {
    if (typeof ap === "number") {
      const am: number = ap;
      API.addCredit(user, am)
        .then((response) => {
          setUser(response.data);
          kaching();
          setSnackbarMsg(am < 0
            ? `Successfully removed ${Cur.formatString(am)} from your Account`
            : `Successfully added ${Cur.formatString(am)} to your Account`);
        }).catch(handleError);
    } else {
      const p: Product = ap;
      API.buyProduct(user, p)
        .then((response) => {
          setUser(response.data);
          kaching();
          setSnackbarMsg(`Successfully bought ${p.name} `
            + `for ${Cur.formatString(p.price)}`);
        }).catch(handleError);
    }
  };
  return (
    <React.Fragment>
      <TopBar leftNode={
        <Button onClick={props.backToList}>
          <KeyboardBackspace /> Back
        </Button>
      } title={`User: ${props.user.name}`}
      fabAction={openSettings}
      fabIcon={<SettingsIcon />} />
      <Main>
        <Grid container justify="center">
          <Grid item xs={12} md={3} className={classes.aside}>
            <AsidePanel user={user} transactions={"disabled"} />
          </Grid>
          <ChangeCreditPanels addCredit={addCredit}
            backToList={props.backToList}
            onBarcodeNotFound={handleBarcodeNotFound} />
        </Grid>
      </Main>
      {audio}
      <Snackbar
        open={snackbarMsg != null}
        onClose={closeSnackbar}
        ContentProps={{
          "aria-describedby": "message-id"
        }}
        message={<span id="message-id">{snackbarMsg}</span>}
      />
    </React.Fragment>
  );
};

export default UserDetails;
