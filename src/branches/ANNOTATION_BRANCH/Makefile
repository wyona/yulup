# Targets:
#   mozilla-distclean: cleans out the objecs in the mozilla tree, but
#       does not clean out the seperate objdir. In order to clean the
#		objdir, simply delete it.
#
#   mozilla-checkout: checks out the xulrunner tree. This
#       is platform-agnostic.
#
#   mozilla-build-xulrunner: builds xulrunner in a separate objdir.
#
#   mozilla-remove-xulrunner: deletes the complete xulrunner src tree
#       as well as the corresponding obj files (but not the copied
#       away Gecko SDK.
#
#   mozilla-build-gecko-sdk: placeholder target. First executes the
#       the mozilla-build-xulrunner target and then the mozilla-install-gecko-sdk
#       target.
#
#   mozilla-install-gecko-sdk: copies the Gecko SDK from the platform-specific
#       xulrunner objdir to the platform-specific dir in the SDK directory.
#
#   mozilla-remove-gecko-sdk: deletes the complete platform-specific
#       Gecko SDK.
#
# To get build and install your platform-specific Gecko SDK, follow
# these steps:
#
# 1. If you already have done this step for a different platform, you
#    can skip this step and proceed directly to step 2. Otherwise, if
#    you are just setting up the source tree for the first time, do:
#      $ make mozilla-checkout
#
# 2. Build your platform-specific version of the Gecko SDK:
#      $ make mozilla-build-gecko-sdk
#
# You're done.

PLATFORM            := $(shell uname -p)+$(shell uname -s)
ROOT_DIR            := $(shell pwd)
GECKO_SDK_DIR       := mozilla/gecko-sdk/$(PLATFORM)
XULRUNNER_SRC_DIR   := mozilla/xulrunner/src
XULRUNNER_OBJ_DIR   := mozilla/xulrunner/bin/$(PLATFORM)
MOZILLA_TREE_CONFIG := mozilla/mozilla-tree.config
MOZILLA_BRANCH      := $(shell cat $(MOZILLA_TREE_CONFIG))

build:
	# TODO

pkg:
	# TODO

clean:
	# TODO

# DO NOT exercise this target until bug https://bugzilla.mozilla.org/show_bug.cgi?id=337494 is fixed!
# Note that in order to clean the objdir, you just have to delete it.
#mozilla-distclean: mozilla-remove-gecko-sdk
#	@echo "Distclean Mozilla build"
#	make -C $(XULRUNNER_SRC_DIR)/mozilla/ -f client.mk distclean

# Note that in order to clean the objdir, you just have to delete it.
mozilla-clean: mozilla-remove-gecko-sdk
	@echo "Clean Mozilla build"
	make -C $(XULRUNNER_SRC_DIR)/mozilla/ -f client.mk clean

mozilla-checkout: mozilla-remove-xulrunner
	@echo "Checkout Mozilla XULRunner tree (branch $(MOZILLA_BRANCH))"
	cd $(XULRUNNER_SRC_DIR) && cvs -d :pserver:anonymous@cvs-mirror.mozilla.org:/cvsroot co -r $(MOZILLA_BRANCH) mozilla/client.mk
	make -C $(XULRUNNER_SRC_DIR)/mozilla -f client.mk checkout MOZ_CO_PROJECT=xulrunner
	printf '. $$topsrcdir/xulrunner/config/mozconfig\n' > $(XULRUNNER_SRC_DIR)/mozilla/.mozconfig

mozilla-update:
	# TODO

# Parallel building with 4 tasks (-j4)
mozilla-build-xulrunner:
	@echo "Build XULRunner"
	make -C $(XULRUNNER_SRC_DIR)/mozilla -f client.mk build MOZ_OBJDIR=$(ROOT_DIR)/$(XULRUNNER_OBJ_DIR)

mozilla-remove-xulrunner:
	@echo "Remove all in $(XULRUNNER_SRC_DIR)"
	rm -rf $(XULRUNNER_SRC_DIR)/*
	@echo "Remove all in $(XULRUNNER_OBJ_DIR)"
	rm -rf $(XULRUNNER_OBJ_DIR)/*

mozilla-build-gecko-sdk: mozilla-build-xulrunner mozilla-install-gecko-sdk

mozilla-install-gecko-sdk: mozilla-remove-gecko-sdk
	@echo "Copy the Gecko SDK from $(XULRUNNER_OBJ_DIR)/dist/sdk to $(GECKO_SDK_DIR)"
	mkdir $(GECKO_SDK_DIR)
	cp -r $(XULRUNNER_OBJ_DIR)/dist/sdk $(GECKO_SDK_DIR)

mozilla-remove-gecko-sdk:
	@echo "Remove old Gecko SDK for platform $(PLATFORM)"
	rm -rf $(GECKO_SDK_DIR)

.PHONY: mozilla-distclean mozilla-checkout mozilla-build-xulrunner mozilla-remove-xulrunner mozilla-build-gecko-sdk mozilla-install-gecko-sdk mozilla-remove-gecko-sdk
