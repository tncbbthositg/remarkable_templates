# reMarkable Templates

I've had a custom template for a while that keeps getting wiped out by updates. :(

I decided I'd make it a little more automated . . .

## How to use reMarkable Templates

Install the dependencies.
```
yarn install
```

Install your templates.
```
npm run deploy -- <ip_address> <password>
```

## Templates

Each template should come with a json file for the template metadata.
```
{
  "name": "Weekplanner US",
  "filename": "P Week US",
  "iconCode": "\ue9db",
  "landscape": "false",
  "categories": [
    "Life/organize"
  ]
}
```

More information can be found here: https://remarkablewiki.com/tips/templates
