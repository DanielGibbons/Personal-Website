import React from "react"

import {PrismCode} from "../../components/prism-code"
import BlogPost from "../../components/blog-post"

import BlogPosts from "../../data/blog-posts"
const blogData = BlogPosts.find(bp => bp.id === 'BP_2019_10_26_00')

const BP_2019_10_26_00Page = () => (
  <BlogPost blogData={blogData}>
    <h2 class="sub-title">Overview</h2>
    <p class="body-text">
      Azure is a public cloud provided by Microsoft and is similar to other clouds you may be familiar with such as <strong>Amazon
      Web Services (AWS)</strong>  and the <strong>Google Cloud Platform (GCP)</strong> . All of these clouds allow you to host your web apps and services without
      having to maintain your own hardware. In recent years there has been a huge increase in cloud adoption and as a
      result a number of supporting technologies have been developed. One example of these technologies is <strong>Terraform</strong>
      which allows you to describe your <strong>Infrastructure as Code (IaC)</strong> and automate the provisioning or destructuion of it.
      This post will show you how to get started with provisioning resources using Terraform with Azure. It should also be
      noted that <strong>Terraform</strong> isn't cloud specific and can be used with a range of cloud providers - making it a great
      language to learn if you're interested in devops!
    </p>

    <h2 class="sub-title">Setup an Account with Microsoft Azure</h2>
    <ul>
      <li class="body-text">
        Go to the <a href="https://azure.microsoft.com/en-gb/">Azure Website</a> and setup a free account. You'll need this
        so that you can later use terraform to authenticate with your account to provision resources.
      </li>
    </ul>

    <h2 class="sub-title">Configure Dev Environment for Terraform</h2>
    <ul>
      <li class="body-text">
        Download the latest version of Terraform from the
        <a href="https://www.terraform.io/downloads.html">Terraform Website</a> and follow the installation instructions
        depending on your OS.
      </li>
      <li class="body-text">
        Once Terraform's installed make sure it's on your <strong>PATH</strong>. To check this run <code class="language-bash">terraform -v</code>
        from a shell of your choice. If you see <code class="language-bash">Command not found</code> you'll need to add the location of the
        Terraform binary to your <strong>PATH</strong>.
      </li>
      <li class="body-text">
        You'll also need a text editor. I'd recommend <strong>VS Code</strong> due to it having a range of extensions for Terraform which
        provide syntax highlighting and code snippets, but it's completely up to you.
      </li>
    </ul>

    <h2 class="sub-title">Authenticate Shell to link to Azure Subscription</h2>
    <ul>
      <li class="body-text">
        Install the latest <strong>Azure CLI</strong> from <a href="https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest">here</a> and make sure it is on your <strong>PATH</strong>. The Azure CLI provides an API to interact with your Azure account. We'll be using
        it to authenticate your shell to allow Terraform to create and destroy your Azure account's resources.
      </li>
      <li class="body-text">
        Copy the following bash script (courtesy of <a href="https://twitter.com/theyorkshiredev">@TheYorkshireDev</a>) and save it in a file called <strong>azure-login.sh</strong>. Next run the script
        from the shell session
        you will be using with Terraform. The script will open a browser tab for you to login to your account. After logging
        in follow the instructions in the shell to set
        the Azure subscription you want Terraform to provision resources in. Make sure you keep the shell open to run your
        Terraform commands from later on.
      </li>
    </ul>
    <PrismCode
      code = {
`echo -e "************************************"
echo -e "Authenticating Shell using Azure CLI"
echo -e "************************************\\n"

subscriptions="$(az.cmd login -o tsv | awk 'BEGIN {'{ FS = "t" }'} ; {'{ print $2 " | " $4 }'}')"

echo "Subscription ID | Subscription Name"
echo "------------------------------------ | ------------------------------------"
echo "$subscriptions"

echo -e "\\nEnter Subscription ID:"
read azure_subscription

echo -e "Setting account subscription"
az.cmd account set --subscription="\${azure_subscription}"`
      }
      language="bash"
      plugins={["show-language", "line-numbers"]}
    />
    <h2 class="sub-title">Provision Resources using Terraform</h2>
    <ul>
      <li class="body-text">
        Copy the following code into a <strong>main.tf</strong> file in a directory of your choice.
      </li>
    </ul>

    <PrismCode
      code = {
`variable "prefix" {
  default = "test-dgio"
}

resource "azurerm_resource_group" "test_rg" {
  name     = "\${var.prefix}-rg"
  location = "East US"
}

resource "azurerm_virtual_network" "test_vnet" {
  name                = "\${var.prefix}-vnet"
  address_space       = ["10.0.0.0/24"]
  location            = azurerm_resource_group.test_rg.location
  resource_group_name = azurerm_resource_group.test_rg.name
}

resource "azurerm_subnet" "test_subnet" {
  name                 = "\${var.prefix}-vnet"
  resource_group_name  = azurerm_resource_group.test_rg.name
  virtual_network_name = azurerm_virtual_network.test_rg.name
  address_prefix       = "10.0.0.0/27"
}

resource "azurerm_public_ip" "test_pip" {
  name                = "\${var.prefix}-pip"
  location            = azurerm_resource_group.test_rg.location
  resource_group_name = azurerm_resource_group.test_rg.name
  allocation_method   = "Static"
}

resource "azurerm_network_interface" "test_nic" {
  name                = "\${var.prefix}-nic"
  location            = azurerm_resource_group.test_rg.location
  resource_group_name = azurerm_resource_group.test_rg.name

  ip_configuration {
    name                          = "test-ipconfig"
    subnet_id                     = azurerm_subnet.test_subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.test_pip.id
  }
}

resource "azurerm_network_security_group" "test_nsg" {
  name                = "\${var.prefix}-nsg"
  location            = azurerm_resource_group.test_rg.location
  resource_group_name = azurerm_resource_group.test_rg.name
}
    
resource "azurerm_network_security_rule" "test_nsr" {
  name                        = "Allow_All_SSH_Inbound_VM"
  priority                    = 100
  direction                   = "Inbound"
  access                      = "Allow"
  protocol                    = "TCP"
  source_port_range           = "*"
  destination_port_range      = "22"
  source_address_prefix       = "*"
  destination_address_prefix  = "*"
  resource_group_name         = azurerm_resource_group.test_rg.name
  network_security_group_name = azurerm_network_security_group.test_nsg.name
}

resource "azurerm_virtual_machine" "test_vm" {
  name                  = "\${var.prefix}-vm"
  location              = azurerm_resource_group.test_rg.location
  resource_group_name   = azurerm_resource_group.test_rg.name
  network_interface_ids = [azurerm_network_interface.test_rg.id]
  vm_size               = "Standard_DS1_v2"

  delete_os_disk_on_termination    = true
  delete_data_disks_on_termination = true
  network_security_group_id        = azurerm_network_security_group.test_nsg.id

  storage_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "18.04-LTS"
    version   = "latest"
  }

  storage_os_disk {
    name              = "\${var.prefix}-osdisk"
    caching           = "ReadWrite"
    create_option     = "FromImage"
    managed_disk_type = "Standard_LRS"
  }

  os_profile {
    computer_name  = "\${var.prefix}-vm"
    admin_username = "testadmin"
    admin_password = "Password1234!"
  }

  os_profile_linux_config {
    disable_password_authentication = false
  }
}`
      }
      language="hcl"
      plugins={["show-language", "line-numbers"]}
    />
    <ul>
      <li class="body-text">
        The code above will create a Virtual Machine that you'll be able to <strong>SSH</strong> in to.
      </li>
      <li class="body-text">
        Using the shell you ran <strong>azure-login.sh</strong> from <code class="language-bash">cd</code> into the directory where you saved
        <strong>main.tf</strong>. From here run <code class="language-bash">terraform plan</code> where you will see the resources Terraform has
        interpreted
        you want from reading the <strong>main.tf</strong> file.
      </li>
      <li class="body-text">
        Next run <code class="language-bash">terraform apply</code>. This will provision the resources outlined from the plan and you can see the
        resources by visiting the Azure Portal.
      </li>
      <li class="body-text">
        Using an <strong>SSH</strong> client of your choice connect to the Virtual Machine you've just provisioned. You'll find the Public IP of your VM in the Azure Portal.
      </li>
    </ul>
  </BlogPost>
)

export default BP_2019_10_26_00Page