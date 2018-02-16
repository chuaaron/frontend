// @flow
import React from "react";
import List, { ListItem, ListSubheader, ListItemText } from "material-ui/List";
import Cur from "formatCurrency";
import { DateTime } from "luxon";
import Paper from "material-ui/Paper";

type Props = {
  user: User,
  transactions: Array<Transaction> | "disabled"
}

export default class AsidePanel extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  renderTransaction(transaction: Transaction) {
    return (
      <ListItem key={transaction.id}>
        <ListItemText
          primary={[
            Cur.format(transaction.delta, {
              fmt:"diff",
              color: "colorful",
              inline: true
            }),
            ` (${transaction.description})`
          ]}
          secondary={
            DateTime.fromMillis(transaction.time)
              .setLocale("de")
              .toLocaleString(DateTime.DATETIME_MED)
          }/>
      </ListItem>
    );
  }

  renderTransactions = () => {
    if (this.props.transactions === "disabled") {
      return (
        <ListItem>
          <ListItemText
            primary={"Transaction logging is disabled in your settings."} />
        </ListItem>);
    }
    if (this.props.transactions.length === 0) {
      return (
        <ListItem>
          <ListItemText primary={"No recent transactions."} />
        </ListItem>);
    }
    return this.props.transactions.map(this.renderTransaction);
  }

  render() {
    return [
      <Paper style={{ marginBottom: 20 }}>
        <List>
          <ListItem>
            <ListItemText
              primary={Cur.format(this.props.user.credit,
                { fmt: "normal", color: "negOnly"})}
              secondary="Current Credit" />
          </ListItem>
        </List>
      </Paper>,
      <Paper>
        <List>
          <ListSubheader>Last Transactions</ListSubheader>
          { this.renderTransactions() }
        </List>
      </Paper>
    ];
  }
}
